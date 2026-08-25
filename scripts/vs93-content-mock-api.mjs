import http from "node:http";

const now = "2026-08-25T18:00:00.000Z";
const workspace = { id: "workspace-ui", name: "Kairo Studio", role: "owner" };
const brand = { id: "brand-ui", workspaceId: workspace.id, name: "TheDukeMan", publicSourceUrl: "https://example.com" };

const campaignHero = {
  id: "campaign-hero",
  workspaceId: workspace.id,
  brandId: brand.id,
  ideaId: "idea-hero",
  researchId: "research-hero",
  angleId: "angle-hero",
  name: "Duke 390",
  objective: "Engagement",
  supportingClaimIds: [],
  status: "draft",
  createdAt: "2026-08-25T12:00:00.000Z",
};
const campaignReel = { ...campaignHero, id: "campaign-reel", ideaId: "idea-reel", name: "Duke 390 in 15 seconds", objective: "Engagement" };
const campaignBuilt = { ...campaignHero, id: "campaign-built", ideaId: "idea-built", name: "Built to anything", objective: "Awareness" };
const campaignSound = { ...campaignHero, id: "campaign-sound", ideaId: "idea-sound", name: "Duke 390 sound test", objective: "Engagement" };

function asset(id, campaignId, channel, format, topic, audience = "Bike enthusiasts") {
  return {
    id,
    campaignId,
    channel,
    format,
    audience,
    topic,
    hookType: "statement",
    cta: "Save this",
    currentVersion: 1,
    status: "draft",
    createdAt: "2026-08-25T12:00:00.000Z",
  };
}
function version(id, assetId, content, createdAt, actor = "user") {
  return {
    id,
    assetId,
    version: 1,
    parentVersionId: null,
    content,
    supportingClaimIds: [],
    actor,
    action: "draft",
    createdAt,
  };
}

const aInstagram = asset("asset-instagram", "campaign-hero", "instagram", "carousel", "5 reasons the Duke 390 is built different");
const aFacebook = asset("asset-facebook", "campaign-hero", "facebook", "image", "POV: City ride on the Duke 390");
const aLinkedin = asset("asset-linkedin", "campaign-hero", "linkedin", "image", "Built to anything");
const aReel = asset("asset-reel", "campaign-reel", "instagram", "reel", "Duke 390 in 15 seconds");
const aSound = asset("asset-sound", "campaign-sound", "manual", "short", "Duke 390 sound test");
const aWeekend = asset("asset-weekend", "campaign-built", "instagram", "carousel", "Weekend escape on the Duke 390");

const details = {
  "campaign-hero": {
    campaign: campaignHero,
    assets: [
      { asset: aInstagram, versions: [version("version-instagram", aInstagram.id, "High performance, control and everyday thrill.\n\nNot just a ride. An experience. #Duke390 #BuiltDifferent #RideKTM", "2026-08-25T16:00:00.000Z")] },
      { asset: aFacebook, versions: [version("version-facebook", aFacebook.id, "Engage riders with a relatable city moment.", "2026-08-24T18:00:00.000Z")] },
      { asset: aLinkedin, versions: [version("version-linkedin", aLinkedin.id, "Bold design. Every day.", "2026-08-24T17:00:00.000Z")] },
    ],
  },
  "campaign-reel": {
    campaign: campaignReel,
    assets: [{ asset: aReel, versions: [version("version-reel", aReel.id, "Fast cut. Real sound. Pure adrenaline.", "2026-08-25T14:00:00.000Z")] }],
  },
  "campaign-sound": {
    campaign: campaignSound,
    assets: [{ asset: aSound, versions: [version("version-sound", aSound.id, "Raw exhaust note you'll love.", "2026-08-23T18:00:00.000Z")] }],
  },
  "campaign-built": {
    campaign: campaignBuilt,
    assets: [{ asset: aWeekend, versions: [version("version-weekend", aWeekend.id, "Freedom. Roads. No limits.", "2026-08-22T18:00:00.000Z")] }],
  },
};

const campaigns = [campaignHero, campaignReel, campaignBuilt, campaignSound];

function review(id, versionId, state = "passed") {
  return {
    id,
    versionId,
    version: 1,
    status: state,
    revisionCycle: 0,
    requestedAt: "2026-08-25T16:05:00.000Z",
    completedAt: "2026-08-25T16:06:00.000Z",
    truth: { passed: state === "passed", findings: state === "passed" ? [] : [{ code: "copy", severity: "hard-fail", message: "Update the content before approval." }] },
    critic: { passed: state === "passed", score: state === "passed" ? 92 : 65, findings: [] },
  };
}
function approval(id, versionId, channel, accountRef) {
  return {
    id,
    versionId,
    version: 1,
    reviewId: `review-${versionId}`,
    approverAccountId: "account-ui",
    destination: { channel, accountRef },
    approvedAt: "2026-08-25T16:10:00.000Z",
  };
}

const reviewStatus = {
  "asset-instagram": { review: review("review-instagram", "version-instagram", "passed"), approval: null },
  "asset-reel": { review: review("review-reel", "version-reel", "revision-required"), approval: null },
  "asset-facebook": { review: review("review-facebook", "version-facebook", "passed"), approval: approval("approval-facebook", "version-facebook", "facebook", "fb-ui") },
  "asset-linkedin": { review: review("review-linkedin", "version-linkedin", "passed"), approval: approval("approval-linkedin", "version-linkedin", "linkedin", "li-ui") },
  "asset-sound": { review: review("review-sound", "version-sound", "passed"), approval: approval("approval-sound", "version-sound", "manual", "manual-ui") },
  "asset-weekend": { review: review("review-weekend", "version-weekend", "passed"), approval: approval("approval-weekend", "version-weekend", "instagram", "ig-ui") },
};

const commands = [
  {
    id: "cmd-linkedin", workspaceId: workspace.id, brandId: brand.id, campaignId: "campaign-hero", assetId: "asset-linkedin",
    versionId: "version-linkedin", version: 1, approvalId: "approval-linkedin", channelAccountId: "li-account", channel: "linkedin",
    accountRef: "li-ui", contentType: "image", scheduledFor: "2026-08-26T10:00:00.000Z", status: "scheduled", attemptCount: 0,
    createdAt: "2026-08-24T17:10:00.000Z",
  },
  {
    id: "cmd-sound", workspaceId: workspace.id, brandId: brand.id, campaignId: "campaign-sound", assetId: "asset-sound",
    versionId: "version-sound", version: 1, approvalId: "approval-sound", channelAccountId: "manual-account", channel: "manual",
    accountRef: "manual-ui", contentType: "video", scheduledFor: "2026-08-23T18:00:00.000Z", status: "published", attemptCount: 1,
    createdAt: "2026-08-23T18:05:00.000Z",
  },
  {
    id: "cmd-weekend", workspaceId: workspace.id, brandId: brand.id, campaignId: "campaign-built", assetId: "asset-weekend",
    versionId: "version-weekend", version: 1, approvalId: "approval-weekend", channelAccountId: "ig-account", channel: "instagram",
    accountRef: "ig-ui", contentType: "carousel", scheduledFor: "2026-08-22T18:00:00.000Z", status: "published", attemptCount: 1,
    createdAt: "2026-08-22T18:05:00.000Z",
  },
];

const channelAccounts = [
  { id: "ig-account", workspaceId: workspace.id, brandId: brand.id, channel: "instagram", authMethod: "instagram-login", accountRef: "ig-ui", displayName: "@thedukeman", capabilities: ["publish-carousel", "publish-image", "publish-reel"], status: "connected", connectedAt: now },
  { id: "fb-account", workspaceId: workspace.id, brandId: brand.id, channel: "facebook", authMethod: "facebook-login", accountRef: "fb-ui", displayName: "TheDukeMan", capabilities: ["publish-image"], status: "connected", connectedAt: now },
  { id: "li-account", workspaceId: workspace.id, brandId: brand.id, channel: "linkedin", authMethod: "provider-native", accountRef: "li-ui", displayName: "TheDukeMan", capabilities: ["publish-image"], status: "connected", connectedAt: now },
];

const slideHeadlines = [
  "5 reasons the Duke 390 is built different",
  "Built for performance",
  "Precision handling",
  "Advanced technology",
  "Ready for anything",
];
function carouselReview(assetId, campaignId) {
  return {
    id: `carousel-${assetId}`,
    assetId,
    assetVersion: 1,
    renderVersionId: `render-${assetId}`,
    status: "ready",
    templateId: "template-clean",
    styleId: "style-duke",
    templates: [],
    styles: [],
    slides: slideHeadlines.map((headline, index) => ({
      id: `${assetId}-slide-${index + 1}`,
      position: index + 1,
      role: index === 0 ? "cover" : "body",
      headline,
      body: index === 0 ? "High performance, control and everyday thrill." : "Designed for riders who want more from every road.",
      renderedUrl: `http://127.0.0.1:4000/media/${assetId}-${index + 1}.svg`,
      qualityFindings: [],
    })),
    qualitySummary: { errors: 0, warnings: 0, advisories: 0 },
  };
}

const notifications = { brandId: brand.id, items: [{ id: "n1", kind: "publishing-failed", brandId: brand.id, occurredAt: now, source: { type: "publish-command", id: "cmd-old" }, context: { failureReason: "A publish needs attention.", campaignId: "campaign-hero", assetId: "asset-instagram", channel: "instagram" } }] };

function json(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": "*" });
  res.end(JSON.stringify(body));
}
function svg(res, id) {
  const number = Number(id.match(/-(\d+)$/)?.[1] ?? 1);
  const headline = slideHeadlines[Math.max(0, Math.min(slideHeadlines.length - 1, number - 1))];
  const markup = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080"><rect width="1080" height="1080" fill="#16191d"/><rect x="54" y="54" width="972" height="972" rx="38" fill="#24282e"/><path d="M80 820 C280 660 450 710 610 620 S850 480 1000 360" fill="none" stroke="#ee641f" stroke-width="24" opacity=".85"/><circle cx="690" cy="705" r="122" fill="#101216" stroke="#ee641f" stroke-width="20"/><circle cx="425" cy="760" r="88" fill="#101216" stroke="#ee641f" stroke-width="16"/><path d="M410 690 L610 610 L730 690 L580 735 Z" fill="#ee641f"/><text x="540" y="230" text-anchor="middle" fill="#fff" font-family="Arial, sans-serif" font-size="66" font-weight="700">${headline.replaceAll("&", "&amp;")}</text><text x="540" y="320" text-anchor="middle" fill="#f47a34" font-family="Arial, sans-serif" font-size="34" font-weight="700">THE DUKE 390</text></svg>`;
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
  if (path === `/api/v1/brands/${brand.id}/channel-accounts`) return json(res, 200, channelAccounts);
  const detailMatch = path.match(new RegExp(`^/api/v1/brands/${brand.id}/campaigns/([^/]+)$`));
  if (detailMatch) return json(res, details[decodeURIComponent(detailMatch[1])] ? 200 : 404, details[decodeURIComponent(detailMatch[1])] ?? { detail: "Campaign not found" });
  const reviewMatch = path.match(new RegExp(`^/api/v1/brands/${brand.id}/assets/([^/]+)/review-status$`));
  if (reviewMatch) return json(res, 200, reviewStatus[decodeURIComponent(reviewMatch[1])] ?? { review: null, approval: null });
  const carouselMatch = path.match(new RegExp(`^/api/v1/brands/${brand.id}/campaigns/([^/]+)/assets/([^/]+)/carousel-review$`));
  if (carouselMatch) {
    const campaignId = decodeURIComponent(carouselMatch[1]);
    const assetId = decodeURIComponent(carouselMatch[2]);
    if (assetId === "asset-instagram" || assetId === "asset-weekend") return json(res, 200, carouselReview(assetId, campaignId));
    return json(res, 404, { detail: "Carousel review not found" });
  }
  return json(res, 404, { detail: `No VS-93 fixture for ${path}` });
});
server.listen(4000, "127.0.0.1", () => console.log("VS-93 Content fixture listening on 127.0.0.1:4000"));
