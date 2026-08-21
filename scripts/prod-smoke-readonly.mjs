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
console.log("PUBLIC_SMOKE=PASS");

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
  if (!bundle?.research || !Array.isArray(bundle.angles) || bundle.angles.length < 2) throw new Error(`${spec.brandName} did not produce Research + >=2 Angles`);

  const corpus = [
    bundle.research.summary,
    ...(bundle.research.evidence ?? []).flatMap((e) => [e?.sourceTitle, e?.sourceUrl]),
    ...(bundle.research.claims ?? []).map((c) => c?.text),
  ].filter(Boolean).join("\n");
  if (spec.forbidden.test(corpus)) throw new Error(`${spec.brandName} admitted materially off-topic research evidence`);
  if ((bundle.research.evidence?.length ?? 0) < 2) throw new Error(`${spec.brandName} Research persisted fewer than 2 evidence items`);
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
  const detail = await jsonRequest(`/api/v1/brands/${encodeURIComponent(current.spec.brand.id)}/campaigns/${encodeURIComponent(campaign.id)}`, auth);
  if (detail.response.status !== 200 || detail.body?.campaign?.id !== campaign.id) throw new Error(`${current.spec.brandName} Campaign detail failed`);
  console.log(`CAMPAIGN_PASS=${current.spec.brandName}:${campaign.id}`);
}
console.log("MULTI_BRAND_CAMPAIGN_SMOKE=PASS");
console.log(`PRODUCTION_E2E_SMOKE=PASS:${expectedSha}`);

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
