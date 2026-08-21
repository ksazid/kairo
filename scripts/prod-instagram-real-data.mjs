const base = required("KAIRO_API_URL").replace(/\/$/, "");
const expectedSha = required("KAIRO_RELEASE_SHA");
const token = required("KAIRO_SMOKE_TOKEN");
const imageUrl = required("KAIRO_INSTAGRAM_IMAGE_URL");
const primarySourceUrl = required("KAIRO_REAL_DATA_SOURCE_URL");
const secondarySourceUrl = required("KAIRO_REAL_DATA_SECONDARY_SOURCE_URL");
const sourceUrls = [primarySourceUrl, secondarySourceUrl];

const auth = { authorization: `Bearer ${token}` };

for (const [path, expected] of [
  ["/health/live", { status: "ok" }],
  ["/health/ready", { status: "ready" }],
  ["/version", { releaseSha: expectedSha }],
]) {
  const { response, body } = await jsonRequest(path);
  if (response.status !== 200) throw new Error(`${path} returned ${response.status}`);
  for (const [key, value] of Object.entries(expected)) {
    if (body?.[key] !== value) throw new Error(`${path} expected ${key}=${value} but received ${body?.[key]}`);
  }
}
console.log(`PUBLIC_SMOKE=PASS:${expectedSha}`);

const { response: sessionResponse, body: session } = await jsonRequest("/api/v1/session", auth);
if (sessionResponse.status !== 200 || !session?.workspaces?.[0]?.id) throw new Error("authenticated session unavailable");
const workspaceId = session.workspaces[0].id;
const brands = await expectArray(`/api/v1/workspaces/${encodeURIComponent(workspaceId)}/brands`, auth);

const targets = [];
for (const brand of brands) {
  const accounts = await expectArray(`/api/v1/brands/${encodeURIComponent(brand.id)}/channel-accounts`, auth);
  for (const account of accounts) {
    if (account?.channel === "instagram" && account?.status === "connected" && Array.isArray(account?.capabilities) && account.capabilities.includes("publish-image")) {
      targets.push({ brand, account });
    }
  }
}
if (targets.length !== 1) throw new Error(`Expected exactly one connected Instagram publish-image target; found ${targets.length}`);
const target = targets[0];
const brandIdRaw = target.brand.id;
const brandId = encodeURIComponent(brandIdRaw);
console.log(`INSTAGRAM_TARGET=PASS:${target.brand.name}:${target.account.displayName}:${target.account.accountRef}`);

const imageCheck = await fetch(imageUrl, { redirect: "follow" });
if (!imageCheck.ok) throw new Error(`Instagram image returned HTTP ${imageCheck.status}`);
const imageType = imageCheck.headers.get("content-type") ?? "";
if (!imageType.toLowerCase().startsWith("image/")) throw new Error(`Instagram image returned non-image content type: ${imageType}`);
await imageCheck.arrayBuffer();
console.log(`INSTAGRAM_MEDIA_PREFLIGHT=PASS:${imageType}`);

for (const sourceUrl of sourceUrls) {
  const sourceHost = new URL(sourceUrl).hostname.toLowerCase();
  if (!sourceHost.endsWith("ktm.com")) throw new Error(`Real-data source must be an official ktm.com page, got ${sourceHost}`);
}
if (new Set(sourceUrls).size !== 2) throw new Error("Real-data smoke requires two distinct official KTM source URLs");

const runTag = Date.now();
const ideasPath = `/api/v1/brands/${brandId}/ideas`;
const ideaTitle = `2026 KTM 390 Duke official-data post ${runTag}`;
const premise = `Research a factual Instagram post about the 2026 KTM 390 Duke using official KTM data. Primary source: ${primarySourceUrl}. Secondary source: ${secondarySourceUrl}. Prefer exact technical specifications such as displacement, power, torque, suspension, braking or weight only when directly supported by official KTM evidence. Do not use unrelated sustainability, fashion, thrift, or generic social-media claims.`;
const ideaCreate = await jsonRequest(ideasPath, auth, { method: "POST", body: { title: ideaTitle, premise } });
if (ideaCreate.response.status !== 201 || !ideaCreate.body?.id) throw new Error(`Real-data Idea creation failed: ${ideaCreate.response.status} ${JSON.stringify(ideaCreate.body)}`);
const ideaId = ideaCreate.body.id;
const ideaPath = `/api/v1/brands/${brandId}/ideas/${encodeURIComponent(ideaId)}`;
console.log(`REAL_DATA_IDEA=PASS:${ideaId}`);

let bundle = null;
for (let attempt = 0; attempt < 3; attempt += 1) {
  const developed = await jsonRequest(`${ideaPath}/research`, auth, { method: "POST" });
  if (developed.response.status === 200 && developed.body?.research && Array.isArray(developed.body?.angles)) {
    bundle = developed.body;
    break;
  }
  const visible = await jsonRequest(ideaPath, auth);
  if (visible.response.status === 200 && visible.body?.research && Array.isArray(visible.body?.angles) && visible.body.angles.length) {
    bundle = visible.body;
    break;
  }
  if (attempt < 2) await sleep((attempt + 1) * 8000);
}
if (!bundle?.research || !Array.isArray(bundle.angles) || !bundle.angles.length) throw new Error("Fresh KTM Research did not produce a usable dossier and Angles");

const officialEvidenceIds = new Set(
  (bundle.research.evidence ?? [])
    .filter((item) => {
      try { return new URL(item.sourceUrl).hostname.toLowerCase().endsWith("ktm.com"); } catch { return false; }
    })
    .map((item) => item.id),
);
if (officialEvidenceIds.size < 2) throw new Error(`Fresh Research must contain both official ktm.com sources; found ${officialEvidenceIds.size}: ${JSON.stringify((bundle.research.evidence ?? []).map((e) => e.sourceUrl))}`);

const claimsById = new Map((bundle.research.claims ?? []).map((claim) => [claim.id, claim]));
const officialFactClaims = (bundle.research.claims ?? []).filter((claim) =>
  claim.classification === "fact" &&
  claim.verificationState === "supported" &&
  claim.freshness === "fresh" &&
  Array.isArray(claim.evidenceIds) &&
  claim.evidenceIds.some((id) => officialEvidenceIds.has(id)),
);
if (!officialFactClaims.length) throw new Error("Fresh Research has official KTM evidence but no supported fresh fact Claims tied to it");
const officialFactIds = new Set(officialFactClaims.map((claim) => claim.id));

function angleIsTruthSafe(angle) {
  if (!Array.isArray(angle?.supportingClaimIds) || !angle.supportingClaimIds.length) return false;
  return angle.supportingClaimIds.every((id) => {
    const claim = claimsById.get(id);
    if (!claim) return false;
    if (claim.classification === "fact" && (claim.verificationState !== "supported" || claim.freshness !== "fresh")) return false;
    const authz = claim.firstPersonAuthorization;
    if (authz !== "not-applicable" && authz !== "authorized") return false;
    return true;
  });
}

const rankedAngles = bundle.angles
  .filter(angleIsTruthSafe)
  .map((angle) => ({
    angle,
    officialFacts: angle.supportingClaimIds.filter((id) => officialFactIds.has(id)).map((id) => claimsById.get(id)).filter(Boolean),
  }))
  .filter((item) => item.officialFacts.length)
  .sort((a, b) => b.officialFacts.length - a.officialFacts.length);
if (!rankedAngles.length) throw new Error("No truth-safe Angle is grounded in an official KTM fact Claim");
const chosen = rankedAngles[0];

let selected = bundle.angles.find((angle) => angle.id === chosen.angle.id && angle.status === "selected");
if (!selected) {
  const selection = await jsonRequest(`${ideaPath}/angles/${encodeURIComponent(chosen.angle.id)}/select`, auth, {
    method: "POST",
    body: { expectedVersion: chosen.angle.version },
  });
  if (selection.response.status !== 200 || !Array.isArray(selection.body)) throw new Error(`KTM Angle selection failed: ${selection.response.status} ${JSON.stringify(selection.body)}`);
  selected = selection.body.find((angle) => angle.id === chosen.angle.id && angle.status === "selected");
}
if (!selected) throw new Error("KTM Angle selection did not persist");
console.log(`REAL_DATA_RESEARCH=PASS:${bundle.research.id}:officialEvidence=${officialEvidenceIds.size}:officialFacts=${officialFactClaims.length}`);
console.log(`REAL_DATA_ANGLE=PASS:${selected.id}:${chosen.officialFacts.length}`);

const campaignsPath = `/api/v1/brands/${brandId}/campaigns`;
const campaignCreate = await jsonRequest(campaignsPath, auth, {
  method: "POST",
  body: {
    ideaId,
    name: `2026 KTM 390 Duke — official data ${runTag}`,
    objective: "Publish a concise factual Instagram post grounded only in official KTM-supported claims, with a clear rider-focused CTA.",
  },
});
if (campaignCreate.response.status !== 201 || !campaignCreate.body?.id) throw new Error(`Real-data Campaign creation failed: ${campaignCreate.response.status} ${JSON.stringify(campaignCreate.body)}`);
const campaignId = encodeURIComponent(campaignCreate.body.id);
console.log(`REAL_DATA_CAMPAIGN=PASS:${campaignCreate.body.id}`);

const factTexts = chosen.officialFacts.map((claim) => claim.text.trim()).filter(Boolean).slice(0, 3);
if (!factTexts.length) throw new Error("Selected KTM Angle has no usable official fact text");
const captionCandidates = [
  `2026 KTM 390 Duke — verified from KTM:\n\n${factTexts.map((text) => `• ${text}`).join("\n")}\n\nWhich of these specs matters most to you on the road?\n\n#KTM390Duke #Duke390 #KTM #Motorcycles`,
  `2026 KTM 390 Duke: ${factTexts.slice(0, 2).join(" ")}\n\nSource: KTM. Which spec matters most to you?\n\n#KTM390Duke #Duke390 #Motorcycles`,
  `${factTexts[0]}\n\nVerified against KTM's official 2026 390 Duke data. Would this matter to you as a rider?\n\n#KTM390Duke #Duke390`,
];

let approvedAsset = null;
let passedReview = null;
for (let attempt = 0; attempt < captionCandidates.length; attempt += 1) {
  const caption = captionCandidates[attempt].slice(0, 1900);
  const assetCreate = await jsonRequest(`/api/v1/brands/${brandId}/campaigns/${campaignId}/assets`, auth, {
    method: "POST",
    body: {
      channel: "instagram",
      format: "image",
      audience: "KTM 390 Duke riders and motorcycle enthusiasts",
      topic: "2026 KTM 390 Duke official specifications",
      hookType: "verified-spec",
      cta: "Which spec matters most to you?",
      content: caption,
    },
  });
  if (assetCreate.response.status !== 201 || !Array.isArray(assetCreate.body?.assets)) throw new Error(`Real-data Content Asset creation failed: ${assetCreate.response.status} ${JSON.stringify(assetCreate.body)}`);
  const entry = assetCreate.body.assets.find((item) => item?.asset?.topic === "2026 KTM 390 Duke official specifications" && item?.versions?.at(-1)?.content === caption);
  if (!entry?.asset?.id || entry.asset.currentVersion !== 1) throw new Error("Real-data Content Asset could not be identified after creation");

  let reviewed = null;
  for (let reviewTry = 0; reviewTry < 3; reviewTry += 1) {
    const result = await jsonRequest(`/api/v1/brands/${brandId}/campaigns/${campaignId}/assets/${encodeURIComponent(entry.asset.id)}/review`, auth, {
      method: "POST",
      body: { expectedVersion: 1, brandContextVersion: `${brandIdRaw}@current`, revisionCycle: attempt },
    });
    if (result.response.status === 201) { reviewed = result.body; break; }
    if (reviewTry < 2) await sleep((reviewTry + 1) * 6000);
  }
  if (reviewed?.status === "passed") {
    approvedAsset = entry;
    passedReview = reviewed;
    break;
  }
  console.log(`REAL_DATA_REVIEW_RETRY:${attempt + 1}:${reviewed?.status ?? "request-failed"}`);
}
if (!approvedAsset || !passedReview) throw new Error("No real-data KTM caption passed Kairo Content Review");
console.log(`REAL_DATA_CONTENT_REVIEW=PASS:${approvedAsset.asset.id}`);

const approval = await jsonRequest(`/api/v1/brands/${brandId}/campaigns/${campaignId}/assets/${encodeURIComponent(approvedAsset.asset.id)}/approve`, auth, {
  method: "POST",
  body: { expectedVersion: 1, destination: { channel: "instagram", accountRef: target.account.accountRef } },
});
if (approval.response.status !== 201 || !approval.body?.id) throw new Error(`Real-data Content approval failed: ${approval.response.status} ${JSON.stringify(approval.body)}`);
console.log(`REAL_DATA_CONTENT_APPROVAL=PASS:${approval.body.id}`);

const scheduled = await jsonRequest(`/api/v1/brands/${brandId}/campaigns/${campaignId}/assets/${encodeURIComponent(approvedAsset.asset.id)}/schedule`, auth, {
  method: "POST",
  body: { channelAccountId: target.account.id, contentType: "image", mediaItems: [{ kind: "image", url: imageUrl }] },
});
if (scheduled.response.status !== 201 || !scheduled.body?.id) throw new Error(`Real-data Instagram Publish command failed: ${scheduled.response.status} ${JSON.stringify(scheduled.body)}`);
if (["manual-required", "failed", "unknown", "cancelled"].includes(scheduled.body.status)) throw new Error(`Real-data Instagram Publish entered ${scheduled.body.status}`);
console.log(`REAL_DATA_PUBLISH_COMMAND=PASS:${scheduled.body.id}:${scheduled.body.status}`);

const command = await waitForPublished(brandId, scheduled.body.id, auth);
console.log(`REAL_DATA_INSTAGRAM_PROVIDER_PUBLISH=PASS:${command.id}:published`);
const calendar = await expectArray(`/api/v1/brands/${brandId}/calendar`, auth);
const calendarEntry = calendar.find((item) => item?.id === command.id);
if (!calendarEntry || calendarEntry.status !== "published") throw new Error("Real-data published command missing from Calendar");
console.log(`REAL_DATA_CALENDAR=PASS:${command.id}:published`);
const performance = await jsonRequest(`/api/v1/brands/${brandId}/performance`, auth);
if (performance.response.status !== 200) throw new Error(`Performance read failed: ${performance.response.status}`);
console.log("REAL_DATA_PERFORMANCE=PASS");
console.log(`PRODUCTION_INSTAGRAM_REAL_DATA_E2E=PASS:${expectedSha}:${command.id}`);

async function waitForPublished(encodedBrandId, commandId, headers) {
  for (let attempt = 0; attempt < 36; attempt += 1) {
    const calendar = await expectArray(`/api/v1/brands/${encodedBrandId}/calendar`, headers);
    const command = calendar.find((item) => item?.id === commandId);
    if (!command) throw new Error("Instagram Publish command disappeared from Calendar");
    if (command.status === "published") return command;
    if (["failed", "unknown", "manual-required", "cancelled"].includes(command.status)) throw new Error(`Instagram provider Publish failed with status ${command.status}`);
    if (attempt < 35) await sleep(5000);
  }
  throw new Error("Instagram provider Publish did not reach published within 180 seconds");
}
function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}
async function request(path, headers = {}, init = {}) {
  const finalHeaders = { ...headers, ...(init.body !== undefined ? { "content-type": "application/json" } : {}), ...(init.headers ?? {}) };
  return fetch(`${base}${path}`, { ...init, headers: finalHeaders, body: init.body !== undefined ? JSON.stringify(init.body) : undefined, redirect: "manual" });
}
async function jsonRequest(path, headers = {}, init = {}) {
  const response = await request(path, headers, init);
  let body = null;
  try { body = await response.json(); } catch {}
  return { response, body };
}
async function expectArray(path, headers) {
  const { response, body } = await jsonRequest(path, headers);
  if (response.status !== 200 || !Array.isArray(body)) throw new Error(`${path} did not return an array (${response.status})`);
  return body;
}
function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }