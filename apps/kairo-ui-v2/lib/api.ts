import { cookies } from "next/headers";
import { buildContinueItems, type CampaignSummary, type ContinueItem, type CreationFormat, type IdeaSummary } from "./home";

export type HomeOpportunity = {
  id: string;
  title: string;
  rationale?: string;
  whyNow?: string;
  developmentDirection?: string;
  scores?: { relevance?: number; audienceFit?: number; overall?: number };
  details?: { recommendedFormat?: string; proposedAngle?: string };
};

export type HomeData = {
  authenticated: boolean;
  brandId?: string;
  brandName: string;
  opportunities: HomeOpportunity[];
  continueItems: ContinueItem[];
  learning?: { statement: string; interpretation?: string };
};

export type SimpleCreation = {
  id: string;
  status: "queued" | "understanding-goal" | "researching" | "choosing-angle" | "building-campaign" | "ready" | "needs-attention";
  progress: { message: string };
  campaignId?: string;
  assetId?: string;
  failureReason?: string;
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
