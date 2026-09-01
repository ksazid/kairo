import { cookies } from "next/headers";
import { buildContinueItems, type CampaignSummary, type ContinueItem, type CreationFormat, type IdeaSummary } from "./home";
import { settingsFallback, type PresenterResponse, type SettingsChannel, type SettingsData } from "./settings-data";

export type HomeOpportunity = {
  id: string;
  title: string;
  rationale?: string;
  whyNow?: string;
  developmentDirection?: string;
  status?: "new" | "saved" | "ignored" | "developing";
  createdAt?: string;
  updatedAt?: string;
  scores?: { relevance?: number; audienceFit?: number; overall?: number };
  details?: {
    recommendedFormat?: string;
    recommendedChannel?: string;
    proposedAngle?: string;
    hook?: string;
    targetAudience?: string;
    objective?: string;
    confidence?: number;
  };
};

export type HomeData = {
  authenticated: boolean;
  brandId?: string;
  brandName: string;
  opportunities: HomeOpportunity[];
  continueItems: ContinueItem[];
  learning?: { statement: string; interpretation?: string };
};

export type CampaignView = {
  id: string;
  workspaceId: string;
  brandId: string;
  ideaId: string;
  name: string;
  objective: string;
  status: "draft" | "in-progress" | "scheduled" | "published";
  createdAt: string;
};

export type ContentAssetView = {
  id: string;
  campaignId: string;
  channel: "linkedin" | "instagram" | "facebook" | "manual";
  format: string;
  audience: string;
  topic: string;
  hookType: string;
  cta: string;
  currentVersion: number;
  status: "draft";
  createdAt: string;
};

export type ContentVersionView = {
  id: string;
  assetId: string;
  version: number;
  content: string;
  actor: "user" | "ai";
  createdAt: string;
  libraryAssetRefs?: Array<{ kind: "image" | "video" | "document" | "other"; previewRef?: string }>;
};

export type CampaignDetailView = {
  campaign: CampaignView;
  assets: Array<{ asset: ContentAssetView; versions: ContentVersionView[] }>;
};

export type ContentReviewStatusView = {
  review: { versionId: string; status: "review" | "revision-required" | "passed" | "archived" } | null;
  approval: { versionId: string; approvedAt: string } | null;
};

export type PublishCommandView = {
  assetId: string;
  versionId: string;
  scheduledFor: string;
  status: "scheduled" | "dispatching" | "published" | "failed" | "unknown" | "manual-required" | "cancelled";
  createdAt: string;
};

export type ContentData = HomeData & {
  details: CampaignDetailView[];
  reviews: Record<string, ContentReviewStatusView | null>;
  commands: PublishCommandView[];
};

export type SimpleCreation = {
  id: string;
  status: "queued" | "understanding-goal" | "researching" | "choosing-angle" | "building-campaign" | "ready" | "needs-attention";
  progress: { message: string };
  campaignId?: string;
  assetId?: string;
  failureReason?: string;
};

export type ManualHunterRun = {
  evidenceCount: number;
  candidateCount: number;
  opportunityCount: number;
  degradedSources?: string[];
};

const apiBase = () => (process.env.KAIRO_API_URL ?? "http://127.0.0.1:4000").replace(/\/$/, "");

async function accessToken() {
  return (await cookies()).get("kairo_access_token")?.value ?? null;
}

function api(token: string, path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  headers.set("authorization", `Bearer ${token}`);
  if (init?.body != null) headers.set("content-type", "application/json");
  return fetch(`${apiBase()}${path}`, { ...init, cache: "no-store", headers });
}

async function bodyOrError<T>(response: Response, fallback: string): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { detail?: string } | null;
    throw new Error(body?.detail ?? fallback);
  }
  return await response.json() as T;
}

export async function getHomeData(requestedBrandId?: string): Promise<HomeData> {
  const token = await accessToken();
  if (!token) return { authenticated: false, brandName: "Sazzid", opportunities: [], continueItems: [] };
  const sessionResponse = await api(token, "/api/v1/session");
  if (!sessionResponse.ok) return { authenticated: false, brandName: "Sazzid", opportunities: [], continueItems: [] };
  const session = await sessionResponse.json() as { workspaces?: Array<{ id: string }> };
  const workspaceId = session.workspaces?.[0]?.id;
  if (!workspaceId) return { authenticated: true, brandName: "Sazzid", opportunities: [], continueItems: [] };
  const brandsResponse = await api(token, `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/brands`);
  const brands = brandsResponse.ok ? await brandsResponse.json() as Array<{ id: string; name: string }> : [];
  const brand = brands.find((candidate) => candidate.id === requestedBrandId) ?? brands[0];
  if (!brand) return { authenticated: true, brandName: "Sazzid", opportunities: [], continueItems: [] };
  const base = `/api/v1/brands/${encodeURIComponent(brand.id)}`;
  const [opportunitiesResponse, campaignsResponse, ideasResponse, learningsResponse] = await Promise.all([
    api(token, `${base}/opportunities`),
    api(token, `${base}/campaigns`),
    api(token, `${base}/ideas`),
    api(token, `${base}/learnings`),
  ]);
  const opportunities = opportunitiesResponse.ok ? await opportunitiesResponse.json() as HomeOpportunity[] : [];
  const campaigns = campaignsResponse.ok ? await campaignsResponse.json() as CampaignSummary[] : [];
  const ideas = ideasResponse.ok ? await ideasResponse.json() as IdeaSummary[] : [];
  const learnings = learningsResponse.ok ? await learningsResponse.json() as Array<{ statement: string; interpretation?: string; status: string; createdAt: string }> : [];
  const learning = learnings.filter((item) => item.status === "accepted").sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  return {
    authenticated: true,
    brandId: brand.id,
    brandName: brand.name,
    opportunities,
    continueItems: buildContinueItems(brand.id, campaigns, ideas),
    ...(learning ? { learning: { statement: learning.statement, ...(learning.interpretation ? { interpretation: learning.interpretation } : {}) } } : {}),
  };
}

export async function getSettingsData(requestedBrandId?: string): Promise<SettingsData> {
  const token = await accessToken();
  if (!token) return settingsFallback();
  const sessionResponse = await api(token, "/api/v1/session");
  if (!sessionResponse.ok) return settingsFallback();
  const session = await sessionResponse.json() as {
    account: { id: string; email?: string; displayName?: string };
    workspaces?: Array<{ id: string; name: string; role: "owner" | "member" }>;
  };
  const workspace = session.workspaces?.[0] ?? null;
  if (!workspace) {
    return {
      authenticated: true,
      account: { id: session.account.id, displayName: session.account.displayName ?? session.account.email ?? "Kairo member", ...(session.account.email ? { email: session.account.email } : {}) },
      workspace: null,
      brand: null,
      channels: [],
      presenter: null,
    };
  }
  const brandsResponse = await api(token, `/api/v1/workspaces/${encodeURIComponent(workspace.id)}/brands`);
  const brands = brandsResponse.ok ? await brandsResponse.json() as Array<{ id: string; workspaceId: string; name: string }> : [];
  const brand = brands.find((candidate) => candidate.id === requestedBrandId) ?? brands[0] ?? null;
  if (!brand) {
    return {
      authenticated: true,
      account: { id: session.account.id, displayName: session.account.displayName ?? session.account.email ?? "Kairo member", ...(session.account.email ? { email: session.account.email } : {}) },
      workspace,
      brand: null,
      channels: [],
      presenter: null,
    };
  }
  const base = `/api/v1/brands/${encodeURIComponent(brand.id)}`;
  const [channelsResponse, presenterResponse] = await Promise.all([
    api(token, `${base}/channel-accounts`),
    api(token, `${base}/presenter`),
  ]);
  return {
    authenticated: true,
    account: { id: session.account.id, displayName: session.account.displayName ?? session.account.email ?? "Kairo member", ...(session.account.email ? { email: session.account.email } : {}) },
    workspace,
    brand,
    channels: channelsResponse.ok ? await channelsResponse.json() as SettingsChannel[] : [],
    presenter: presenterResponse.ok ? await presenterResponse.json() as PresenterResponse : null,
  };
}

export async function saveSettingsPresenter(brandId: string, body: Record<string, unknown>): Promise<PresenterResponse> {
  const token = await accessToken();
  if (!token) throw new Error("Sign in to save this presenter.");
  return bodyOrError<PresenterResponse>(
    await api(token, `/api/v1/brands/${encodeURIComponent(brandId)}/presenter`, { method: "PUT", body: JSON.stringify(body) }),
    "Kairo could not save this presenter.",
  );
}

export async function getContentData(requestedBrandId?: string): Promise<ContentData> {
  const identity = await getHomeData(requestedBrandId);
  if (!identity.authenticated || !identity.brandId) return { ...identity, details: [], reviews: {}, commands: [] };
  const token = await accessToken();
  if (!token) return { ...identity, details: [], reviews: {}, commands: [] };
  const brand = encodeURIComponent(identity.brandId);
  const [campaignsResponse, commandsResponse] = await Promise.all([
    api(token, `/api/v1/brands/${brand}/campaigns`),
    api(token, `/api/v1/brands/${brand}/calendar`),
  ]);
  const campaigns = campaignsResponse.ok ? await campaignsResponse.json() as CampaignView[] : [];
  const commands = commandsResponse.ok ? await commandsResponse.json() as PublishCommandView[] : [];
  const details = await Promise.all(campaigns.map(async (campaign) => {
    const response = await api(token, `/api/v1/brands/${brand}/campaigns/${encodeURIComponent(campaign.id)}`);
    return response.ok ? await response.json() as CampaignDetailView : { campaign, assets: [] };
  }));
  const assets = details.flatMap((detail) => detail.assets.map((entry) => entry.asset));
  const reviews = Object.fromEntries(await Promise.all(assets.map(async (asset) => {
    const response = await api(token, `/api/v1/brands/${brand}/assets/${encodeURIComponent(asset.id)}/review-status`);
    return [asset.id, response.ok ? await response.json() as ContentReviewStatusView : null] as const;
  })));
  return { ...identity, details, reviews, commands };
}

export async function startHomeCreation(input: {
  brandId: string;
  format: CreationFormat;
  opportunityId?: string;
  title?: string;
  direction?: string;
  source?: string;
}): Promise<SimpleCreation> {
  const token = await accessToken();
  if (!token) throw new Error("Sign in to create with Kairo.");
  const brand = encodeURIComponent(input.brandId);
  let ideaId: string | undefined;
  if (input.opportunityId) {
    const opportunity = encodeURIComponent(input.opportunityId);
    const opportunities = await bodyOrError<Array<{ id: string; status: string }>>(await api(token, `/api/v1/brands/${brand}/opportunities`), "Unable to load this opportunity.");
    if (opportunities.find((item) => item.id === input.opportunityId)?.status !== "developing") {
      await bodyOrError(await api(token, `/api/v1/brands/${brand}/opportunities/${opportunity}/develop`, { method: "POST" }), "Unable to prepare this opportunity.");
    }
    const development = await bodyOrError<{ ideaId: string }>(await api(token, `/api/v1/brands/${brand}/opportunities/${opportunity}/development`, { method: "POST" }), "Unable to develop this opportunity.");
    ideaId = development.ideaId;
  }
  const body = {
    goal: input.format === "campaign" ? "Build a coordinated campaign" : "Create useful Brand content",
    contentPreference: input.format,
    ...([input.title, input.direction].filter(Boolean).length ? { input: [input.title, input.direction].filter(Boolean).join("\n\n") } : {}),
    ...(input.source ? { source: input.source } : {}),
    ...(ideaId ? { ideaId } : {}),
  };
  return bodyOrError<SimpleCreation>(await api(token, `/api/v1/brands/${brand}/simple-creations`, { method: "POST", body: JSON.stringify(body) }), "Kairo could not start this creation.");
}

export async function getHomeCreation(brandId: string, creationId: string): Promise<SimpleCreation> {
  const token = await accessToken();
  if (!token) throw new Error("Sign in to continue.");
  return bodyOrError<SimpleCreation>(await api(token, `/api/v1/brands/${encodeURIComponent(brandId)}/simple-creations/${encodeURIComponent(creationId)}`), "Kairo could not read this creation.");
}

export async function actOnHomeOpportunity(brandId: string, opportunityId: string, action: "save" | "ignore"): Promise<HomeOpportunity> {
  const token = await accessToken();
  if (!token) throw new Error("Sign in to update this opportunity.");
  return bodyOrError<HomeOpportunity>(
    await api(token, `/api/v1/brands/${encodeURIComponent(brandId)}/opportunities/${encodeURIComponent(opportunityId)}/${action}`, { method: "POST" }),
    action === "save" ? "Kairo could not save this opportunity." : "Kairo could not dismiss this opportunity.",
  );
}

export async function runManualHunter(brandId: string): Promise<ManualHunterRun> {
  const token = await accessToken();
  if (!token) throw new Error("Sign in to refresh discovery.");
  return bodyOrError<ManualHunterRun>(
    await api(token, `/api/v1/brands/${encodeURIComponent(brandId)}/recommendations`, { method: "POST" }),
    "Kairo could not refresh discovery.",
  );
}

export async function getHomeOpportunities(brandId: string): Promise<HomeOpportunity[]> {
  const token = await accessToken();
  if (!token) throw new Error("Sign in to load discovery.");
  return bodyOrError<HomeOpportunity[]>(
    await api(token, `/api/v1/brands/${encodeURIComponent(brandId)}/opportunities`),
    "Kairo could not load discovery.",
  );
}
