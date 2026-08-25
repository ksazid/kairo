import http from "node:http";

const workspace = { id: "workspace-ui", name: "Kairo Studio", role: "owner" };
const brand = {
  id: "brand-ui",
  workspaceId: workspace.id,
  name: "Northstar Studio",
  publicSourceUrl: "https://northstar.example",
};

const now = "2026-08-25T12:00:00.000Z";

const opportunities = [
  {
    id: "opp-1",
    workspaceId: workspace.id,
    brandId: brand.id,
    title: "Three mistakes that make a product launch feel generic",
    rationale: "A structured carousel gives your audience a useful checklist while reinforcing your point of view.",
    whyNow: "Launch-planning conversations are active this week.",
    developmentDirection: "Create a carousel breakdown with one mistake per slide and a clear takeaway.",
    status: "new",
    signalIds: [],
    scores: { relevance: 92, evidence: 86, novelty: 78, timeliness: 90, brandAuthority: 93, audienceFit: 91, overall: 91, scoringVersion: "ui-fixture" },
    brandContextVersion: "brand-ui@current",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "opp-2",
    workspaceId: workspace.id,
    brandId: brand.id,
    title: "Show the before-and-after workflow in under 30 seconds",
    rationale: "A short Reel makes the improvement obvious without asking people to read a long explanation.",
    whyNow: "Demonstration-led content is a strong fit for this audience.",
    developmentDirection: "Create a reel demo with before, change and after scenes.",
    status: "new",
    signalIds: [],
    scores: { relevance: 89, evidence: 82, novelty: 84, timeliness: 85, brandAuthority: 88, audienceFit: 87, overall: 88, scoringVersion: "ui-fixture" },
    brandContextVersion: "brand-ui@current",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "opp-3",
    workspaceId: workspace.id,
    brandId: brand.id,
    title: "One visual that explains what makes the service different",
    rationale: "A focused post can communicate the differentiation quickly and give the message room to breathe.",
    whyNow: "The positioning statement is confirmed and ready to reuse.",
    developmentDirection: "Create a single image post with one concise proof point.",
    status: "saved",
    signalIds: [],
    scores: { relevance: 84, evidence: 80, novelty: 76, timeliness: 78, brandAuthority: 90, audienceFit: 86, overall: 84, scoringVersion: "ui-fixture" },
    brandContextVersion: "brand-ui@current",
    createdAt: now,
    updatedAt: now,
  },
];

const performance = [
  { id: "metric-1", workspaceId: workspace.id, brandId: brand.id, publishedPostId: "post-1", name: "reach", capturedAt: now, status: "available", value: 18420, sourceSnapshotId: "snap-1", sourceField: "reach", transformationVersion: "1" },
  { id: "metric-2", workspaceId: workspace.id, brandId: brand.id, publishedPostId: "post-1", name: "saves", capturedAt: now, status: "available", value: 824, sourceSnapshotId: "snap-1", sourceField: "saves", transformationVersion: "1" },
  { id: "metric-3", workspaceId: workspace.id, brandId: brand.id, publishedPostId: "post-1", name: "shares", capturedAt: now, status: "available", value: 466, sourceSnapshotId: "snap-1", sourceField: "shares", transformationVersion: "1" },
  { id: "metric-4", workspaceId: workspace.id, brandId: brand.id, publishedPostId: "post-1", name: "engagement_rate", capturedAt: now, status: "available", value: 6.8, sourceSnapshotId: "snap-1", sourceField: "engagement_rate", transformationVersion: "1" },
];

const notifications = {
  brandId: brand.id,
  items: [
    {
      id: "notification-1",
      kind: "approval-required",
      brandId: brand.id,
      occurredAt: now,
      source: { type: "content-review", id: "review-1" },
      context: { campaignId: "campaign-1", assetId: "asset-1", channel: "instagram" },
    },
  ],
};

const channels = [
  {
    id: "channel-1",
    workspaceId: workspace.id,
    brandId: brand.id,
    channel: "instagram",
    authMethod: "instagram-login",
    accountRef: "northstar",
    displayName: "@northstarstudio",
    capabilities: ["publish-image", "publish-video", "publish-carousel", "publish-reel"],
    status: "connected",
    connectedAt: now,
  },
];

function json(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://127.0.0.1:4000");
  const path = url.pathname;

  if (path === "/health") return json(res, 200, { ok: true });
  if (path === "/api/v1/session") {
    return json(res, 200, { account: { id: "account-ui", email: "owner@example.com", displayName: "Sazid" }, workspaces: [workspace] });
  }
  if (path === `/api/v1/workspaces/${workspace.id}/brands`) return json(res, 200, [brand]);
  if (path === `/api/v1/brands/${brand.id}/opportunities`) return json(res, 200, opportunities);
  if (path === `/api/v1/brands/${brand.id}/performance`) return json(res, 200, performance);
  if (path === `/api/v1/brands/${brand.id}/notifications`) return json(res, 200, notifications);
  if (path === `/api/v1/brands/${brand.id}/channel-accounts`) return json(res, 200, channels);

  return json(res, 404, { detail: `No UI fidelity fixture for ${path}` });
});

server.listen(4000, "127.0.0.1", () => {
  console.log("UI fidelity mock API listening on http://127.0.0.1:4000");
});
