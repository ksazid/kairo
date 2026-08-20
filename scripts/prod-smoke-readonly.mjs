const base = required("KAIRO_API_URL").replace(/\/$/, "");
const expectedSha = required("KAIRO_RELEASE_SHA");
const token = process.env.KAIRO_SMOKE_TOKEN?.trim();

const publicChecks = [
  ["/health/live", 200, { status: "ok" }],
  ["/health/ready", 200, { status: "ready" }],
  ["/version", 200, { releaseSha: expectedSha }],
];
for (const [path, status, shape] of publicChecks) {
  const { response, body } = await jsonRequest(path);
  assertStatus(path, response, status);
  for (const [key, value] of Object.entries(shape)) {
    if (body?.[key] !== value) throw new Error(`${path} expected ${key}=${value} but received ${body?.[key]}`);
  }
}
console.log("PUBLIC_SMOKE=PASS");

if (!token) throw new Error("KAIRO_SMOKE_TOKEN repository secret is missing; authenticated multi-brand production smoke cannot run");

const auth = { authorization: `Bearer ${token}` };
const { response: sessionResponse, body: session } = await jsonRequest("/api/v1/session", auth);
assertStatus("/api/v1/session", sessionResponse, 200);
if (!session?.account?.id || !Array.isArray(session?.workspaces)) throw new Error("session response has invalid shape");

const results = [];
for (const workspace of session.workspaces) {
  if (!workspace?.id) continue;
  const brandsPath = `/api/v1/workspaces/${encodeURIComponent(workspace.id)}/brands`;
  const { response: brandsResponse, body: brands } = await jsonRequest(brandsPath, auth);
  assertStatus(brandsPath, brandsResponse, 200);
  if (!Array.isArray(brands)) throw new Error(`${brandsPath} did not return an array`);

  for (const brand of brands) {
    if (!brand?.id) continue;
    const brandId = encodeURIComponent(brand.id);
    const checks = [
      `/api/v1/brands/${brandId}`,
      `/api/v1/brands/${brandId}/brain`,
      `/api/v1/brands/${brandId}/sources`,
      `/api/v1/brands/${brandId}/ideas`,
      `/api/v1/brands/${brandId}/campaigns`,
      `/api/v1/brands/${brandId}/channel-accounts`,
      `/api/v1/brands/${brandId}/calendar`,
      `/api/v1/brands/${brandId}/performance`,
    ];
    const row = { workspaceId: workspace.id, brandId: brand.id, brandName: brand.name ?? null, checks: {} };
    for (const path of checks) {
      const response = await request(path, auth);
      row.checks[path.split("/").slice(-1)[0] || path] = response.status;
      if (response.status !== 200) throw new Error(`authenticated brand smoke failed for ${path}: ${response.status}`);
      await drain(response);
    }
    results.push(row);
  }
}

console.log(`MULTI_BRAND_COUNT=${results.length}`);
console.log(`MULTI_BRAND_RESULTS=${JSON.stringify(results)}`);
if (results.length < 2) throw new Error(`multi-brand smoke requires at least 2 existing brands but found ${results.length}`);
console.log("AUTHENTICATED_MULTI_BRAND_READ_SMOKE=PASS");

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}
async function request(path, headers = {}) {
  return fetch(`${base}${path}`, { headers, redirect: "manual" });
}
async function jsonRequest(path, headers = {}) {
  const response = await request(path, headers);
  let body = null;
  try { body = await response.json(); } catch {}
  return { response, body };
}
function assertStatus(path, response, expected) {
  if (response.status !== expected) throw new Error(`${path} returned ${response.status}; expected ${expected}`);
}
async function drain(response) {
  try { await response.arrayBuffer(); } catch {}
}
