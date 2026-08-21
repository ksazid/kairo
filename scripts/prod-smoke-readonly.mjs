const base = required("KAIRO_API_URL").replace(/\/$/, "");
const expectedSha = required("KAIRO_RELEASE_SHA");
const token = process.env.KAIRO_SMOKE_TOKEN?.trim();
const smokeImageUrl = required("KAIRO_INSTAGRAM_SMOKE_IMAGE_URL");

for (const [path, status, shape] of [
  ["/health/live", 200, { status: "ok" }],
  ["/health/ready", 200, { status: "ready" }],
  ["/version", 200, { releaseSha: expectedSha }],
]) {
  const { response, body } = await jsonRequest(path);
  if (response.status !== status) throw new Error(`${path} returned ${response.status}; expected ${status}`);
  for (const [key, value] of Object.entries(shape)) {
    if (body?.[key] !== value) throw new Error(`${path} expected ${key}=${value} but received ${body?.[key]}`);
  }
}
console.log(`PUBLIC_SMOKE=PASS:${expectedSha}`);

if (!token) throw new Error("KAIRO_SMOKE_TOKEN repository secret is missing");
const auth = { authorization: `Bearer ${token}` };
const { response: sessionResponse, body: session } = await jsonRequest("/api/v1/session", auth);
if (sessionResponse.status !== 200 || !session?.account?.id || !Array.isArray(session?.workspaces) || !session.workspaces[0]?.id) {
  throw new Error("authenticated session smoke failed");
}
const workspaceId = session.workspaces[0].id;
const brandsPath = `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/brands`;
const brands = await expectArray(brandsPath, auth);
if (!brands.length) throw new Error("No Brands are available for Instagram publish smoke");

const instagramTargets = [];
for (const brand of brands) {
  const accounts = await expectArray(`/api/v1/brands/${encodeURIComponent(brand.id)}/channel-accounts`, auth);
  for (const account of accounts) {
    if (
      account?.channel === "instagram" &&
      account?.status === "connected" &&
      Array.isArray(account?.capabilities) &&
      account.capabilities.includes("publish-image")
    ) {
      instagramTargets.push({ brand, account });
    }
  }
}
if (instagramTargets.length !== 1) {
  const safe = instagramTargets.map(({ brand, account }) => ({
    brandId: brand.id,
    brandName: brand.name,
    channelAccountId: account.id,
    displayName: account.displayName,
    accountRef: account.accountRef,
  }));
  throw new Error(`Expected exactly one connected Instagram publish-image target; found ${instagramTargets.length}: ${JSON.stringify(safe)}`);
}
const target = instagramTargets[0];
console.log(`INSTAGRAM_TARGET=PASS:${target.brand.name}:${target.account.displayName}:${target.account.accountRef}`);

const imageCheck = await fetch(smokeImageUrl, { redirect: "follow" });
if (!imageCheck.ok) throw new Error(`Instagram smoke image returned HTTP ${imageCheck.status}`);
const imageType = imageCheck.headers.get("content-type") ?? "";
if (!imageType.toLowerCase().startsWith("image/")) throw new Error(`Instagram smoke image returned non-image content type: ${imageType}`);
await imageCheck.arrayBuffer();
console.log(`INSTAGRAM_MEDIA_PREFLIGHT=PASS:${imageType}`);

const brandIdRaw = target.brand.id;
const brandId = encodeURIComponent(brandIdRaw);
const campaign = await ensureCampaign(target.brand, auth);
const campaignId = encodeURIComponent(campaign.id);
const campaignPath = `/api/v1/brands/${brandId}/campaigns/${campaignId}`;
let campaignDetail = (await jsonRequest(campaignPath, auth)).body;
if (!campaignDetail?.campaign?.id || !Array.isArray(campaignDetail.assets)) {
  throw new Error("Campaign detail unavailable for Instagram content smoke");
}

const topic = `VS-73 live Instagram publish ${expectedSha.slice(0, 12)}`;
let entry = campaignDetail.assets.find((item) => item?.asset?.topic === topic);
if (!entry) {
  const created = await jsonRequest(`/api/v1/brands/${brandId}/campaigns/${campaignId}/assets`, auth, {
    method: "POST",
    body: {
      channel: "instagram",
      format: "image",
      audience: "Existing Instagram audience",
      topic,
      hookType: "evidence-led",
      cta: "Production publishing verification",
      content: "Create a concise Instagram caption grounded only in this Campaign's supported Claims. Do not mention internal implementation details.",
    },
  });
  if (created.response.status !== 201 || !Array.isArray(created.body?.assets)) {
    throw new Error(`Instagram Content Asset creation failed: ${created.response.status} ${JSON.stringify(created.body)}`);
  }
  campaignDetail = created.body;
  entry = campaignDetail.assets.find((item) => item?.asset?.topic === topic);
}
if (!entry?.asset?.id) throw new Error("Instagram Content Asset not found after creation");

if (entry.asset.currentVersion === 1) {
  const generated = await jsonRequest(
    `/api/v1/brands/${brandId}/campaigns/${campaignId}/assets/${encodeURIComponent(entry.asset.id)}/generate`,
    auth,
    {
      method: "POST",
      body: {
        expectedVersion: 1,
        action: "initial-draft",
        brandContextVersion: `${brandIdRaw}@current`,
      },
    },
  );
  if (generated.response.status !== 201) {
    throw new Error(`Instagram Content generation failed: ${generated.response.status} ${JSON.stringify(generated.body)}`);
  }
  campaignDetail = generated.body;
  entry = campaignDetail.assets.find((item) => item?.asset?.id === entry.asset.id);
}
console.log(`INSTAGRAM_CONTENT_GENERATION=PASS:${entry.asset.id}:v${entry.asset.currentVersion}`);

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

  const reviewed = await jsonRequest(
    `/api/v1/brands/${brandId}/campaigns/${campaignId}/assets/${encodeURIComponent(entry.asset.id)}/review`,
    auth,
    {
      method: "POST",
      body: {
        expectedVersion: latest.version,
        brandContextVersion: `${brandIdRaw}@current`,
        revisionCycle: cycle,
      },
    },
  );
  if (reviewed.response.status !== 201) {
    throw new Error(`Instagram Content Review failed: ${reviewed.response.status} ${JSON.stringify(reviewed.body)}`);
  }
  if (reviewed.body?.status === "passed") {
    passedReview = reviewed.body;
    break;
  }
  if (cycle === 2) {
    throw new Error(`Instagram Content Review still requires revision after three cycles: ${JSON.stringify(reviewed.body)}`);
  }

  const regenerated = await jsonRequest(
    `/api/v1/brands/${brandId}/campaigns/${campaignId}/assets/${encodeURIComponent(entry.asset.id)}/generate`,
    auth,
    {
      method: "POST",
      body: {
        expectedVersion: latest.version,
        action: cycle === 0 ? "alternative" : "simplify",
        brandContextVersion: `${brandIdRaw}@current`,
      },
    },
  );
  if (regenerated.response.status !== 201) {
    throw new Error(`Instagram Content revision generation failed: ${regenerated.response.status} ${JSON.stringify(regenerated.body)}`);
  }
  campaignDetail = regenerated.body;
  entry = campaignDetail.assets.find((item) => item?.asset?.id === entry.asset.id);
}
if (!passedReview) throw new Error("Instagram Content Review did not pass");
console.log(`INSTAGRAM_CONTENT_REVIEW=PASS:${entry.asset.id}:v${entry.asset.currentVersion}`);

const approval = await jsonRequest(
  `/api/v1/brands/${brandId}/campaigns/${campaignId}/assets/${encodeURIComponent(entry.asset.id)}/approve`,
  auth,
  {
    method: "POST",
    body: {
      expectedVersion: entry.asset.currentVersion,
      destination: { channel: "instagram", accountRef: target.account.accountRef },
    },
  },
);
if (approval.response.status !== 201 || !approval.body?.id) {
  throw new Error(`Instagram Content approval failed: ${approval.response.status} ${JSON.stringify(approval.body)}`);
}
console.log(`INSTAGRAM_CONTENT_APPROVAL=PASS:${approval.body.id}`);

const scheduled = await jsonRequest(
  `/api/v1/brands/${brandId}/campaigns/${campaignId}/assets/${encodeURIComponent(entry.asset.id)}/schedule`,
  auth,
  {
    method: "POST",
    body: {
      channelAccountId: target.account.id,
      contentType: "image",
      mediaItems: [{ kind: "image", url: smokeImageUrl }],
    },
  },
);
if (scheduled.response.status !== 201 || !scheduled.body?.id) {
  throw new Error(`Instagram Publish command creation failed: ${scheduled.response.status} ${JSON.stringify(scheduled.body)}`);
}
if (["manual-required", "failed", "unknown", "cancelled"].includes(scheduled.body.status)) {
  throw new Error(`Instagram Publish command entered terminal non-published state immediately: ${scheduled.body.status}`);
}
console.log(`INSTAGRAM_PUBLISH_COMMAND=PASS:${scheduled.body.id}:${scheduled.body.status}`);

const command = await waitForPublished(brandId, scheduled.body.id, auth);
console.log(`INSTAGRAM_PROVIDER_PUBLISH=PASS:${command.id}:${command.status}`);

const calendar = await expectArray(`/api/v1/brands/${brandId}/calendar`, auth);
const calendarEntry = calendar.find((item) => item?.id === scheduled.body.id);
if (!calendarEntry || calendarEntry.status !== "published") {
  throw new Error("Provider-confirmed Instagram Publish is missing from Calendar");
}
console.log(`INSTAGRAM_CALENDAR_RECORD=PASS:${calendarEntry.id}:published`);

const performance = await jsonRequest(`/api/v1/brands/${brandId}/performance`, auth);
if (performance.response.status !== 200) throw new Error(`Performance verification failed: ${performance.response.status}`);
console.log("INSTAGRAM_PERFORMANCE_READ=PASS");

console.log(`PRODUCTION_INSTAGRAM_E2E_SMOKE=PASS:${expectedSha}`);

async function ensureCampaign(brand, headers) {
  const encodedBrandId = encodeURIComponent(brand.id);
  const campaignsPath = `/api/v1/brands/${encodedBrandId}/campaigns`;
  const campaigns = await expectArray(campaignsPath, headers);
  if (campaigns.length) {
    const existing = campaigns[0];
    console.log(`INSTAGRAM_CAMPAIGN=REUSE:${existing.id}`);
    return existing;
  }

  const title = `VS-73 Instagram publish ${expectedSha.slice(0, 12)}`;
  const premise = "Evaluate evidence for a useful, factual social post relevant to this Brand, suitable for a live Instagram publishing verification.";
  const ideasPath = `/api/v1/brands/${encodedBrandId}/ideas`;
  let ideas = await expectArray(ideasPath, headers);
  let idea = ideas.find((item) => item?.title === title && item?.source?.type === "user");
  if (!idea) {
    const created = await jsonRequest(ideasPath, headers, { method: "POST", body: { title, premise } });
    if (created.response.status !== 201 || !created.body?.id) {
      throw new Error(`Instagram publish Idea creation failed: ${created.response.status} ${JSON.stringify(created.body)}`);
    }
    idea = created.body;
  }

  const ideaPath = `/api/v1/brands/${encodedBrandId}/ideas/${encodeURIComponent(idea.id)}`;
  let bundle = (await jsonRequest(ideaPath, headers)).body;
  if (!bundle?.research || !Array.isArray(bundle?.angles) || bundle.angles.length < 2) {
    const developed = await jsonRequest(`${ideaPath}/research`, headers, { method: "POST" });
    if (developed.response.status !== 200) {
      throw new Error(`Sequential Research for Instagram publish failed: ${developed.response.status} ${JSON.stringify(developed.body)}`);
    }
    bundle = developed.body;
  }
  if (!bundle?.research || !Array.isArray(bundle.angles) || bundle.angles.length < 2) {
    throw new Error("Sequential Research did not produce a usable Instagram Campaign basis");
  }

  let selected = bundle.angles.find((item) => item?.status === "selected");
  if (!selected) {
    const candidate = bundle.angles[0];
    const selection = await jsonRequest(
      `/api/v1/brands/${encodedBrandId}/ideas/${encodeURIComponent(idea.id)}/angles/${encodeURIComponent(candidate.id)}/select`,
      headers,
      { method: "POST", body: { expectedVersion: candidate.version } },
    );
    if (selection.response.status !== 200 || !Array.isArray(selection.body)) {
      throw new Error(`Instagram publish Angle selection failed: ${selection.response.status}`);
    }
    selected = selection.body.find((item) => item?.status === "selected");
  }
  if (!selected) throw new Error("Instagram publish Angle selection did not persist");

  const created = await jsonRequest(campaignsPath, headers, {
    method: "POST",
    body: {
      ideaId: idea.id,
      name: `VS-73 Instagram Live Publish ${expectedSha.slice(0, 12)}`,
      objective: "Provider-confirmed production Instagram publishing verification",
    },
  });
  if (created.response.status !== 201 || !created.body?.id) {
    throw new Error(`Instagram Campaign creation failed: ${created.response.status} ${JSON.stringify(created.body)}`);
  }
  console.log(`INSTAGRAM_CAMPAIGN=CREATED:${created.body.id}`);
  return created.body;
}

async function waitForPublished(encodedBrandId, commandId, headers) {
  for (let attempt = 0; attempt < 36; attempt += 1) {
    const calendar = await expectArray(`/api/v1/brands/${encodedBrandId}/calendar`, headers);
    const command = calendar.find((item) => item?.id === commandId);
    if (!command) throw new Error("Instagram Publish command disappeared from Calendar");
    if (command.status === "published") return command;
    if (["failed", "unknown", "manual-required", "cancelled"].includes(command.status)) {
      throw new Error(`Instagram provider Publish failed with command status ${command.status}`);
    }
    if (attempt < 35) await sleep(5_000);
  }
  throw new Error("Instagram provider Publish did not reach published state within 180 seconds");
}

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}
async function request(path, headers = {}, init = {}) {
  const finalHeaders = {
    ...headers,
    ...(init.body !== undefined ? { "content-type": "application/json" } : {}),
    ...(init.headers ?? {}),
  };
  return fetch(`${base}${path}`, {
    ...init,
    headers: finalHeaders,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    redirect: "manual",
  });
}
async function jsonRequest(path, headers = {}, init = {}) {
  const response = await request(path, headers, init);
  let body = null;
  try {
    body = await response.json();
  } catch {}
  return { response, body };
}
async function expectArray(path, headers) {
  const { response, body } = await jsonRequest(path, headers);
  if (response.status !== 200 || !Array.isArray(body)) {
    throw new Error(`${path} did not return an array (${response.status})`);
  }
  return body;
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
