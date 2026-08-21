const base = required("KAIRO_API_URL").replace(/\/$/, "");
const expectedSha = required("KAIRO_RELEASE_SHA");
const token = process.env.KAIRO_SMOKE_TOKEN?.trim();

for (const [path, status, shape] of [
  ["/health/live", 200, { status: "ok" }],
  ["/health/ready", 200, { status: "ready" }],
  ["/version", 200, { releaseSha: expectedSha }],
]) {
  const { response, body } = await jsonRequest(path);
  if (response.status !== status) throw new Error(`${path} returned ${response.status}; expected ${status}`);
  for (const [key, value] of Object.entries(shape)) if (body?.[key] !== value) throw new Error(`${path} expected ${key}=${value} but received ${body?.[key]}`);
}
console.log(`PUBLIC_SMOKE=PASS:${expectedSha}`);

if (!token) throw new Error("KAIRO_SMOKE_TOKEN repository secret is missing");
const auth = { authorization: `Bearer ${token}` };
const { response: sessionResponse, body: session } = await jsonRequest("/api/v1/session", auth);
if (sessionResponse.status !== 200 || !session?.account?.id || !Array.isArray(session?.workspaces) || !session.workspaces[0]?.id) throw new Error("authenticated session smoke failed");
const workspaceId = session.workspaces[0].id;

const smokeSpecs = [
  {
    brandName: "Kairo Smoke Moto",
    ideaTitle: "Motorcycle performance upgrades",
    premise: "Evaluate evidence for motorcycle aftermarket exhaust, air-filter and oil-flow modifications and their effect on engine performance and reliability.",
    forbidden: /state-owned enterprise|firm.?innovation|governmental monitoring|knowledge acquisition strateg/i,
  },
  {
    brandName: "Kairo Smoke SaaS",
    ideaTitle: "Automated invoice reconciliation",
    premise: "Evaluate how software automation can reduce manual invoice reconciliation effort, mismatches and processing time for small businesses.",
    forbidden: /motorcycle|exhaust|air.?filter|oil.?flow/i,
  },
];

const brandsPath = `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/brands`;
let brands = await expectArray(brandsPath, auth);
const smokeBrands = [];
for (const spec of smokeSpecs) {
  let brand = brands.find((item) => item?.name === spec.brandName);
  if (!brand) {
    const created = await jsonRequest(brandsPath, auth, { method: "POST", body: { brandName: spec.brandName } });
    if (created.response.status !== 201 || !created.body?.id) throw new Error(`create Brand ${spec.brandName} failed: ${created.response.status}`);
    brand = created.body;
    brands.push(brand);
    console.log(`CREATED_BRAND=${spec.brandName}:${brand.id}`);
  }
  smokeBrands.push({ ...spec, brand });
}

const readResults = [];
for (const { brand } of smokeBrands) {
  const brandId = encodeURIComponent(brand.id);
  const checks = [
    ["brand", `/api/v1/brands/${brandId}`],
    ["brain", `/api/v1/brands/${brandId}/brain`],
    ["sources", `/api/v1/brands/${brandId}/sources`],
    ["ideas", `/api/v1/brands/${brandId}/ideas`],
    ["campaigns", `/api/v1/brands/${brandId}/campaigns`],
    ["channel-accounts", `/api/v1/brands/${brandId}/channel-accounts`],
    ["calendar", `/api/v1/brands/${brandId}/calendar`],
    ["performance", `/api/v1/brands/${brandId}/performance`],
  ];
  const row = { brandId: brand.id, brandName: brand.name, checks: {} };
  for (const [label, path] of checks) {
    const response = await request(path, auth);
    row.checks[label] = response.status;
    await drain(response);
    if (response.status !== 200) throw new Error(`${brand.name} ${label} failed: ${response.status}`);
  }
  readResults.push(row);
}
console.log(`MULTI_BRAND_RESULTS=${JSON.stringify(readResults)}`);
console.log("AUTHENTICATED_MULTI_BRAND_READ_SMOKE=PASS");

const developed = [];
for (const spec of smokeBrands) {
  const brandId = encodeURIComponent(spec.brand.id);
  const ideasPath = `/api/v1/brands/${brandId}/ideas`;
  let ideas = await expectArray(ideasPath, auth);
  let idea = ideas.find((item) => item?.title === spec.ideaTitle && item?.source?.type === "user");
  if (!idea) {
    const created = await jsonRequest(ideasPath, auth, { method: "POST", body: { title: spec.ideaTitle, premise: spec.premise } });
    if (created.response.status !== 201 || !created.body?.id) throw new Error(`${spec.brandName} create Idea failed: ${created.response.status}`);
    idea = created.body;
    console.log(`CREATED_IDEA=${spec.brandName}:${idea.id}`);
  }
  const ideaPath = `/api/v1/brands/${brandId}/ideas/${encodeURIComponent(idea.id)}`;
  let bundle = (await jsonRequest(ideaPath, auth)).body;
  if (!bundle?.research || !Array.isArray(bundle?.angles) || bundle.angles.length < 2) {
    const research = await jsonRequest(`${ideaPath}/research`, auth, { method: "POST" });
    if (research.response.status !== 200) throw new Error(`${spec.brandName} Research failed: ${research.response.status} ${JSON.stringify(research.body)}`);
    bundle = research.body;
  }
  assertResearch(spec, bundle);
  developed.push({ spec, idea, bundle });
  console.log(`RESEARCH_PASS=${spec.brandName}:evidence=${bundle.research.evidence.length}:angles=${bundle.angles.length}`);
}
console.log("MULTI_BRAND_RESEARCH_ANGLES_SMOKE=PASS");

for (let i = 0; i < developed.length; i++) {
  const current = developed[i];
  const other = developed[(i + 1) % developed.length];
  const leakPath = `/api/v1/brands/${encodeURIComponent(other.spec.brand.id)}/ideas/${encodeURIComponent(current.idea.id)}`;
  const leak = await request(leakPath, auth);
  await drain(leak);
  if (leak.status !== 404) throw new Error(`cross-Brand isolation failed: ${current.idea.id} visible through ${other.spec.brandName} with ${leak.status}`);
}
console.log("CROSS_BRAND_ISOLATION_SMOKE=PASS");

for (const current of developed) {
  let selected = current.bundle.angles.find((a) => a?.status === "selected");
  if (!selected) {
    const candidate = current.bundle.angles[0];
    const select = await jsonRequest(`/api/v1/brands/${encodeURIComponent(current.spec.brand.id)}/ideas/${encodeURIComponent(current.idea.id)}/angles/${encodeURIComponent(candidate.id)}/select`, auth, { method: "POST", body: { expectedVersion: candidate.version } });
    if (select.response.status !== 200 || !Array.isArray(select.body)) throw new Error(`${current.spec.brandName} Angle selection failed: ${select.response.status}`);
    selected = select.body.find((a) => a?.status === "selected") ?? candidate;
    current.bundle.angles = select.body;
  }
  const campaignsPath = `/api/v1/brands/${encodeURIComponent(current.spec.brand.id)}/campaigns`;
  let campaigns = await expectArray(campaignsPath, auth);
  const campaignName = `Smoke Campaign - ${current.spec.brandName}`;
  let campaign = campaigns.find((c) => c?.ideaId === current.idea.id && c?.name === campaignName);
  if (!campaign) {
    const created = await jsonRequest(campaignsPath, auth, { method: "POST", body: { ideaId: current.idea.id, name: campaignName, objective: "Production smoke validation" } });
    if (created.response.status !== 201 || !created.body?.id) throw new Error(`${current.spec.brandName} Campaign creation failed: ${created.response.status} ${JSON.stringify(created.body)}`);
    campaign = created.body;
  }
  current.campaign = campaign;
  console.log(`CAMPAIGN_PASS=${current.spec.brandName}:${campaign.id}`);
}
console.log("MULTI_BRAND_CAMPAIGN_SMOKE=PASS");

// Deliberately exercise two concurrent Research requests for one fresh Idea.
const concurrencyTarget = developed[0];
const concurrencyTitle = `VS-73 concurrent research ${expectedSha.slice(0, 12)}`;
const concurrencyPremise = "Validate that concurrent requests for the same motorcycle research Idea converge on one persisted Research dossier and usable candidate Angles.";
const concurrencyIdeasPath = `/api/v1/brands/${encodeURIComponent(concurrencyTarget.spec.brand.id)}/ideas`;
let concurrencyIdeas = await expectArray(concurrencyIdeasPath, auth);
let concurrencyIdea = concurrencyIdeas.find((item) => item?.title === concurrencyTitle);
if (!concurrencyIdea) {
  const created = await jsonRequest(concurrencyIdeasPath, auth, { method: "POST", body: { title: concurrencyTitle, premise: concurrencyPremise } });
  if (created.response.status !== 201 || !created.body?.id) throw new Error(`concurrency Idea create failed: ${created.response.status}`);
  concurrencyIdea = created.body;
}
const concurrencyPath = `/api/v1/brands/${encodeURIComponent(concurrencyTarget.spec.brand.id)}/ideas/${encodeURIComponent(concurrencyIdea.id)}`;
let concurrencyBundle = (await jsonRequest(concurrencyPath, auth)).body;
if (!concurrencyBundle?.research || !Array.isArray(concurrencyBundle?.angles) || concurrencyBundle.angles.length < 2) {
  const [a, b] = await Promise.all([
    jsonRequest(`${concurrencyPath}/research`, auth, { method: "POST" }),
    jsonRequest(`${concurrencyPath}/research`, auth, { method: "POST" }),
  ]);
  if (a.response.status !== 200 || b.response.status !== 200) throw new Error(`concurrent Research failed: ${a.response.status}/${b.response.status}`);
  const ids = [a.body?.research?.id, b.body?.research?.id].filter(Boolean);
  if (ids.length !== 2 || ids[0] !== ids[1]) throw new Error(`concurrent Research did not converge on one dossier: ${ids.join(",")}`);
  concurrencyBundle = a.body;
}
if (!concurrencyBundle?.research || (concurrencyBundle.angles?.length ?? 0) < 2) throw new Error("concurrent Research did not produce a usable bundle");
console.log(`CONCURRENT_RESEARCH_IDEMPOTENCY_SMOKE=PASS:${concurrencyBundle.research.id}`);

// Continue one Brand through Content -> AI generation -> Review -> Approval -> safe manual publish gate.
const contentTarget = developed[0];
const brandId = encodeURIComponent(contentTarget.spec.brand.id);
const campaignId = encodeURIComponent(contentTarget.campaign.id);
const campaignPath = `/api/v1/brands/${brandId}/campaigns/${campaignId}`;
let campaignDetail = (await jsonRequest(campaignPath, auth)).body;
if (!campaignDetail?.campaign?.id || !Array.isArray(campaignDetail.assets)) throw new Error("Campaign detail unavailable for content smoke");
const topic = `VS-73 production smoke ${expectedSha.slice(0, 12)}`;
let entry = campaignDetail.assets.find((item) => item?.asset?.topic === topic);
if (!entry) {
  const created = await jsonRequest(`/api/v1/brands/${brandId}/campaigns/${campaignId}/assets`, auth, {
    method: "POST",
    body: {
      channel: "manual",
      format: "text",
      audience: "Kairo production QA",
      topic,
      hookType: "evidence-led",
      cta: "Production smoke validation only",
      content: "Create a concise, evidence-grounded production smoke draft using only the campaign's supported claims.",
    },
  });
  if (created.response.status !== 201 || !Array.isArray(created.body?.assets)) throw new Error(`Content Asset creation failed: ${created.response.status} ${JSON.stringify(created.body)}`);
  campaignDetail = created.body;
  entry = campaignDetail.assets.find((item) => item?.asset?.topic === topic);
}
if (!entry?.asset?.id) throw new Error("Content Asset not found after creation");

if (entry.asset.currentVersion === 1) {
  const generated = await jsonRequest(`/api/v1/brands/${brandId}/campaigns/${campaignId}/assets/${encodeURIComponent(entry.asset.id)}/generate`, auth, {
    method: "POST",
    body: { expectedVersion: 1, action: "initial-draft", brandContextVersion: `${contentTarget.spec.brand.id}@current` },
  });
  if (generated.response.status !== 201) throw new Error(`Content generation failed: ${generated.response.status} ${JSON.stringify(generated.body)}`);
  campaignDetail = generated.body;
  entry = campaignDetail.assets.find((item) => item?.asset?.id === entry.asset.id);
}

let passedReview = null;
for (let cycle = 0; cycle <= 2; cycle += 1) {
  const latest = entry?.versions?.at(-1);
  if (!latest || entry.asset.currentVersion !== latest.version) throw new Error("Content version lineage is inconsistent");
  const status = await jsonRequest(`/api/v1/brands/${brandId}/assets/${encodeURIComponent(entry.asset.id)}/review-status`, auth);
  if (status.response.status !== 200) throw new Error(`Review status failed: ${status.response.status}`);
  if (status.body?.review?.status === "passed" && status.body.review.versionId === latest.id) {
    passedReview = status.body.review;
    break;
  }
  const reviewed = await jsonRequest(`/api/v1/brands/${brandId}/campaigns/${campaignId}/assets/${encodeURIComponent(entry.asset.id)}/review`, auth, {
    method: "POST",
    body: { expectedVersion: latest.version, brandContextVersion: `${contentTarget.spec.brand.id}@current`, revisionCycle: cycle },
  });
  if (reviewed.response.status !== 201) throw new Error(`Content Review failed: ${reviewed.response.status} ${JSON.stringify(reviewed.body)}`);
  if (reviewed.body?.status === "passed") {
    passedReview = reviewed.body;
    break;
  }
  if (cycle === 2) throw new Error(`Content Review still requires revision after three cycles: ${JSON.stringify(reviewed.body)}`);
  const regenerated = await jsonRequest(`/api/v1/brands/${brandId}/campaigns/${campaignId}/assets/${encodeURIComponent(entry.asset.id)}/generate`, auth, {
    method: "POST",
    body: { expectedVersion: latest.version, action: cycle === 0 ? "alternative" : "simplify", brandContextVersion: `${contentTarget.spec.brand.id}@current` },
  });
  if (regenerated.response.status !== 201) throw new Error(`Content revision generation failed: ${regenerated.response.status} ${JSON.stringify(regenerated.body)}`);
  campaignDetail = regenerated.body;
  entry = campaignDetail.assets.find((item) => item?.asset?.id === entry.asset.id);
}
if (!passedReview) throw new Error("Content Review did not pass");
console.log(`CONTENT_REVIEW_SMOKE=PASS:${entry.asset.id}:v${entry.asset.currentVersion}`);

const accountRef = "kairo-smoke-manual";
const approval = await jsonRequest(`/api/v1/brands/${brandId}/campaigns/${campaignId}/assets/${encodeURIComponent(entry.asset.id)}/approve`, auth, {
  method: "POST",
  body: { expectedVersion: entry.asset.currentVersion, destination: { channel: "manual", accountRef } },
});
if (approval.response.status !== 201 || !approval.body?.id) throw new Error(`Content approval failed: ${approval.response.status} ${JSON.stringify(approval.body)}`);
console.log(`CONTENT_APPROVAL_SMOKE=PASS:${approval.body.id}`);

const accounts = await expectArray(`/api/v1/brands/${brandId}/channel-accounts`, auth);
const manual = accounts.find((item) => item?.channel === "manual" && item?.accountRef === accountRef && item?.status === "connected");
if (!manual?.id) throw new Error("Smoke manual Channel Account is unavailable");
const scheduledFor = new Date(Date.now() + 5 * 60_000).toISOString();
const scheduled = await jsonRequest(`/api/v1/brands/${brandId}/campaigns/${campaignId}/assets/${encodeURIComponent(entry.asset.id)}/schedule`, auth, {
  method: "POST",
  body: { channelAccountId: manual.id, contentType: "text", scheduledFor },
});
if (scheduled.response.status !== 201 || !scheduled.body?.id || scheduled.body?.status !== "manual-required") throw new Error(`Safe manual publish scheduling failed: ${scheduled.response.status} ${JSON.stringify(scheduled.body)}`);
console.log(`SAFE_MANUAL_PUBLISH_GATE=PASS:${scheduled.body.id}:${scheduled.body.status}`);
const cancelled = await jsonRequest(`/api/v1/brands/${brandId}/publish-commands/${encodeURIComponent(scheduled.body.id)}/cancel`, auth, { method: "POST" });
if (cancelled.response.status !== 200 || cancelled.body?.status !== "cancelled") throw new Error(`Smoke publish command cleanup failed: ${cancelled.response.status}`);

const calendar = await expectArray(`/api/v1/brands/${brandId}/calendar`, auth);
if (!calendar.some((item) => item?.id === scheduled.body.id && item?.status === "cancelled")) throw new Error("Cancelled smoke publish command is missing from calendar");
console.log("CONTENT_TO_MANUAL_PUBLISH_GATE_SMOKE=PASS");
console.log(`PRODUCTION_E2E_SMOKE=PASS:${expectedSha}`);

function assertResearch(spec, bundle) {
  if (!bundle?.research || !Array.isArray(bundle.angles) || bundle.angles.length < 2) throw new Error(`${spec.brandName} did not produce Research + >=2 Angles`);
  const corpus = [
    bundle.research.summary,
    ...(bundle.research.evidence ?? []).flatMap((e) => [e?.sourceTitle, e?.sourceUrl]),
    ...(bundle.research.claims ?? []).map((c) => c?.text),
  ].filter(Boolean).join("\n");
  if (spec.forbidden.test(corpus)) throw new Error(`${spec.brandName} admitted materially off-topic research evidence`);
  if ((bundle.research.evidence?.length ?? 0) < 2) throw new Error(`${spec.brandName} Research persisted fewer than 2 evidence items`);
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
async function drain(response) {
  try { await response.arrayBuffer(); } catch {}
}
