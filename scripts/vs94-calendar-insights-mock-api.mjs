import http from "node:http";

const workspace = { id: "workspace-ui", name: "Kairo Studio", role: "owner" };
const brand = { id: "brand-ui", workspaceId: workspace.id, name: "TheDukeMan", publicSourceUrl: "https://example.com" };
const now = "2026-08-25T12:00:00.000Z";

const contentDefinitions = [
  ["wheel", "Why lighter wheels change how the Duke feels", "carousel", "instagram"],
  ["skyline", "Weekend drive: Skyline loop escape", "reel", "instagram"],
  ["brakes", "Brake upgrades that actually matter", "carousel", "instagram"],
  ["sound", "The sound that turns heads", "reel", "instagram"],
  ["sunset", "Sunset run through the canyons", "reel", "instagram"],
  ["interior", "Interior details you notice every day", "carousel", "instagram"],
];

const campaigns = contentDefinitions.map(([id, title], index) => ({
  id: `campaign-${id}`,
  workspaceId: workspace.id,
  brandId: brand.id,
  ideaId: `idea-${id}`,
  researchId: `research-${id}`,
  angleId: `angle-${id}`,
  name: title,
  objective: "Engagement",
  supportingClaimIds: [],
  status: "draft",
  createdAt: `2026-04-${String(20 + index).padStart(2, "0")}T08:00:00.000Z`,
}));

const assets = new Map(contentDefinitions.map(([id, title, format, channel]) => [id, {
  id: `asset-${id}`,
  campaignId: `campaign-${id}`,
  channel,
  format,
  audience: "Duke riders",
  topic: title,
  hookType: "statement",
  cta: "Save this",
  currentVersion: 1,
  status: "draft",
  createdAt: "2026-04-20T08:00:00.000Z",
}]));

const details = Object.fromEntries(campaigns.map((campaign) => {
  const id = campaign.id.replace("campaign-", "");
  const asset = assets.get(id);
  return [campaign.id, {
    campaign,
    assets: [{
      asset,
      versions: [{
        id: `version-${id}`,
        assetId: asset.id,
        version: 1,
        parentVersionId: null,
        content: campaign.name,
        supportingClaimIds: [],
        actor: "user",
        action: "draft",
        createdAt: "2026-04-20T08:15:00.000Z",
      }],
    }],
  }];
}));

function command(id, iso, status, format = "carousel") {
  return {
    id: `cmd-${id}`,
    workspaceId: workspace.id,
    brandId: brand.id,
    campaignId: `campaign-${id}`,
    assetId: `asset-${id}`,
    versionId: `version-${id}`,
    version: 1,
    approvalId: `approval-${id}`,
    channelAccountId: "ig-account",
    channel: "instagram",
    accountRef: "ig-ui",
    contentType: format === "carousel" ? "carousel" : "video",
    scheduledFor: iso,
    status,
    attemptCount: status === "published" || status === "failed" ? 1 : 0,
    createdAt: "2026-04-20T08:20:00.000Z",
  };
}

const commands = [
  command("wheel", "2023-04-27T10:00:00.000Z", "scheduled", "carousel"),
  command("skyline", "2023-04-27T13:30:00.000Z", "published", "reel"),
  command("brakes", "2023-04-27T18:00:00.000Z", "failed", "carousel"),
  command("sound", "2023-04-26T11:00:00.000Z", "scheduled", "reel"),
  command("sunset", "2023-04-26T17:45:00.000Z", "published", "reel"),
  command("interior", "2023-04-25T09:15:00.000Z", "published", "carousel"),
];

const palette = {
  wheel: ["#24272d", "#767c86", "wheel"],
  skyline: ["#536b74", "#b9c4ca", "road"],
  brakes: ["#260f11", "#c83a35", "brake"],
  sound: ["#1a1c20", "#6a6d72", "exhaust"],
  sunset: ["#423829", "#bb8b50", "sunset"],
  interior: ["#24282b", "#707b78", "cockpit"],
};

function carouselReview(id) {
  const [dark, accent] = palette[id] ?? palette.wheel;
  return {
    id: `carousel-${id}`,
    assetId: `asset-${id}`,
    assetVersion: 1,
    renderVersionId: `render-${id}`,
    status: "ready",
    templateId: "template-reference",
    styleId: "style-duke",
    templates: [],
    styles: [],
    slides: [{
      id: `${id}-slide-1`,
      position: 1,
      role: "cover",
      headline: campaigns.find((item) => item.id === `campaign-${id}`)?.name ?? id,
      body: "",
      renderedUrl: `http://127.0.0.1:4000/media/${id}.svg`,
      qualityFindings: [],
    }],
    qualitySummary: { errors: 0, warnings: 0, advisories: 0 },
  };
}

const performance = [];
// Controlled evidence only: representative observations mirror the approved Insights
// reference while exercising the same real-metric code path used in production.
const dailyRates = [5.3, 6.0, 6.4, 5.7, 6.9, 6.0, 5.4, 6.8, 7.1, 6.7, 6.3, 5.7, 6.5, 7.2, 6.6, 7.4, 8.1, 8.9, 7.0, 6.3, 7.7, 7.2, 7.1, 6.5, 6.2, 6.1, 7.2, 8.3];
for (let i = 0; i < dailyRates.length; i += 1) {
  const date = new Date(Date.UTC(2026, 6, 29 + i, 12, 0, 0)).toISOString();
  performance.push(metric(`rate-${i}`, "engagement-rate", dailyRates[i], date));
}
performance.push(
  metric("reach-current", "reach", 12400, "2026-08-24T12:00:00.000Z"),
  metric("saves-current", "saves", 1200, "2026-08-24T12:00:00.000Z"),
  metric("shares-current", "shares", 320, "2026-08-24T12:00:00.000Z"),
  metric("reach-prev", "reach", 10508.47, "2026-07-10T12:00:00.000Z"),
  metric("saves-prev", "saves", 944.88, "2026-07-10T12:00:00.000Z"),
  metric("shares-prev", "shares", 278.26, "2026-07-10T12:00:00.000Z"),
  metric("rate-prev", "engagement-rate", 6.18, "2026-07-10T12:00:00.000Z"),
);

function metric(id, name, value, capturedAt) {
  return {
    id,
    workspaceId: workspace.id,
    brandId: brand.id,
    publishedPostId: `post-${id}`,
    name,
    capturedAt,
    status: "available",
    value,
    sourceSnapshotId: `snapshot-${id}`,
    sourceField: name,
    transformationVersion: "v1",
  };
}

const learnings = [
  {
    id: "learning-short-video",
    workspaceId: workspace.id,
    brandId: brand.id,
    statement: "Short videos drove more engagement",
    interpretation: "Your short videos had higher engagement than your other comparable content.",
    confidence: 0.86,
    period: { from: "2026-07-26T00:00:00.000Z", to: now },
    applicability: { format: "reel" },
    patterns: [{ dimension: "format", value: "reel", observation: "Higher engagement on comparable short videos.", evidence: [] }],
    evidence: [], contradictions: [], status: "accepted", version: 1, createdAt: now,
  },
  {
    id: "learning-weekend",
    workspaceId: workspace.id,
    brandId: brand.id,
    statement: "Weekend posting performed best",
    interpretation: "Comparable weekend posts showed stronger engagement in this measurement period.",
    confidence: 0.78,
    period: { from: "2026-07-26T00:00:00.000Z", to: now },
    applicability: {},
    patterns: [{ dimension: "timing", value: "weekend", observation: "Weekend observations were stronger.", evidence: [] }],
    evidence: [], contradictions: [], status: "accepted", version: 1, createdAt: now,
  },
];

const experiments = [{
  id: "experiment-short-video",
  workspaceId: workspace.id,
  brandId: brand.id,
  hypothesis: "Create more short videos",
  variants: [{ id: "a", description: "Short video" }, { id: "b", description: "Static post" }],
  primaryMetric: "engagement-rate",
  status: "draft",
  createdAt: now,
}];

const notifications = { brandId: brand.id, items: [
  { id: "n1", kind: "publishing-failed", brandId: brand.id, occurredAt: now, source: { type: "publish-command", id: "cmd-brakes" }, context: { failureReason: "Publishing needs attention.", campaignId: "campaign-brakes", assetId: "asset-brakes", channel: "instagram" } },
  { id: "n2", kind: "content-ready", brandId: brand.id, occurredAt: now, source: { type: "content-asset", id: "asset-wheel" }, context: { campaignId: "campaign-wheel", assetId: "asset-wheel" } },
  { id: "n3", kind: "content-ready", brandId: brand.id, occurredAt: now, source: { type: "content-asset", id: "asset-sound" }, context: { campaignId: "campaign-sound", assetId: "asset-sound" } },
] };

function json(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": "*" });
  res.end(JSON.stringify(body));
}

function svg(res, id) {
  const [dark, accent, label] = palette[id] ?? palette.wheel;
  const markup = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${dark}"/><stop offset="1" stop-color="${accent}"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/><circle cx="540" cy="355" r="125" fill="#111317" opacity=".82"/><circle cx="540" cy="355" r="78" fill="none" stroke="#dedfe2" stroke-width="24" opacity=".8"/><circle cx="275" cy="405" r="92" fill="#111317" opacity=".85"/><path d="M245 340 460 255 590 330 430 375Z" fill="#e95d20" opacity=".9"/><path d="M0 510 C170 450 330 480 800 360" fill="none" stroke="#fff" stroke-width="18" opacity=".18"/><text x="44" y="72" fill="#fff" font-family="Arial,sans-serif" font-size="34" font-weight="700">${label}</text></svg>`;
  res.writeHead(200, { "content-type": "image/svg+xml", "cache-control": "no-store", "access-control-allow-origin": "*" });
  res.end(markup);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://127.0.0.1:4000");
  const path = url.pathname;
  if (path === "/health") return json(res, 200, { ok: true });
  if (path.startsWith("/media/") && path.endsWith(".svg")) return svg(res, path.slice(7, -4));
  if (path === "/api/v1/session") return json(res, 200, { account: { id: "account-ui", email: "owner@example.com", displayName: "Sazid" }, workspaces: [workspace] });
  if (path === `/api/v1/workspaces/${workspace.id}/brands`) return json(res, 200, [brand]);
  if (path === `/api/v1/brands/${brand.id}`) return json(res, 200, brand);
  if (path === `/api/v1/brands/${brand.id}/notifications`) return json(res, 200, notifications);
  if (path === `/api/v1/brands/${brand.id}/campaigns`) return json(res, 200, campaigns);
  if (path === `/api/v1/brands/${brand.id}/calendar`) return json(res, 200, commands);
  if (path === `/api/v1/brands/${brand.id}/performance`) return json(res, 200, performance);
  if (path === `/api/v1/brands/${brand.id}/learnings`) return json(res, 200, learnings);
  if (path === `/api/v1/brands/${brand.id}/experiments`) return json(res, 200, experiments);
  const detailMatch = path.match(new RegExp(`^/api/v1/brands/${brand.id}/campaigns/([^/]+)$`));
  if (detailMatch) {
    const detail = details[decodeURIComponent(detailMatch[1])];
    return json(res, detail ? 200 : 404, detail ?? { detail: "Campaign not found" });
  }
  const carouselMatch = path.match(new RegExp(`^/api/v1/brands/${brand.id}/campaigns/([^/]+)/assets/([^/]+)/carousel-review$`));
  if (carouselMatch) {
    const id = decodeURIComponent(carouselMatch[2]).replace("asset-", "");
    const asset = assets.get(id);
    if (asset?.format === "carousel") return json(res, 200, carouselReview(id));
    return json(res, 404, { detail: "Carousel review not available" });
  }
  return json(res, 404, { detail: `No VS-94 fixture for ${path}` });
});
server.listen(4000, "127.0.0.1", () => console.log("VS-94 Calendar/Insights fixture listening on 127.0.0.1:4000"));
