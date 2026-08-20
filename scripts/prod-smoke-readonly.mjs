const base = required("KAIRO_API_URL").replace(/\/$/, "");
const expectedSha = required("KAIRO_RELEASE_SHA");
const token = process.env.KAIRO_SMOKE_TOKEN?.trim();

for (const [path, status, shape] of [
  ["/health/live", 200, { status: "ok" }],
  ["/health/ready", 200, { status: "ready" }],
  ["/version", 200, { releaseSha: expectedSha }],
]) {
  const { response, body } = await jsonRequest(path);
  if (response.status !== status) {
    await marker(`public-${slug(path)}-status-${response.status}`);
    throw new Error(`${path} returned ${response.status}; expected ${status}`);
  }
  for (const [key, value] of Object.entries(shape)) {
    if (body?.[key] !== value) {
      await marker(`${slug(path)}-${key}-mismatch-${slug(String(body?.[key] ?? "missing"))}`);
      throw new Error(`${path} expected ${key}=${value} but received ${body?.[key]}`);
    }
  }
}
await marker("public-pass");
console.log("PUBLIC_SMOKE=PASS");

if (!token) {
  await marker("token-missing");
  throw new Error("KAIRO_SMOKE_TOKEN repository secret is missing; authenticated multi-brand production smoke cannot run");
}
await marker("auth-start");

const auth = { authorization: `Bearer ${token}` };
const { response: sessionResponse, body: session } = await jsonRequest("/api/v1/session", auth);
await marker(`session-status-${sessionResponse.status}`);
if (sessionResponse.status !== 200) throw new Error(`/api/v1/session returned ${sessionResponse.status}; expected 200`);
if (!session?.account?.id || !Array.isArray(session?.workspaces)) {
  await marker("session-shape-invalid");
  throw new Error("session response has invalid shape");
}

const results = [];
for (const workspace of session.workspaces) {
  if (!workspace?.id) continue;
  const brandsPath = `/api/v1/workspaces/${encodeURIComponent(workspace.id)}/brands`;
  const { response: brandsResponse, body: brands } = await jsonRequest(brandsPath, auth);
  if (brandsResponse.status !== 200) {
    await marker(`workspace-brands-status-${brandsResponse.status}`);
    throw new Error(`${brandsPath} returned ${brandsResponse.status}`);
  }
  if (!Array.isArray(brands)) {
    await marker("workspace-brands-shape-invalid");
    throw new Error(`${brandsPath} did not return an array`);
  }

  for (const brand of brands) {
    if (!brand?.id) continue;
    const brandId = encodeURIComponent(brand.id);
    const checks = [
      [`brand`, `/api/v1/brands/${brandId}`],
      [`brain`, `/api/v1/brands/${brandId}/brain`],
      [`sources`, `/api/v1/brands/${brandId}/sources`],
      [`ideas`, `/api/v1/brands/${brandId}/ideas`],
      [`campaigns`, `/api/v1/brands/${brandId}/campaigns`],
      [`channel-accounts`, `/api/v1/brands/${brandId}/channel-accounts`],
      [`calendar`, `/api/v1/brands/${brandId}/calendar`],
      [`performance`, `/api/v1/brands/${brandId}/performance`],
    ];
    const row = { workspaceId: workspace.id, brandId: brand.id, brandName: brand.name ?? null, checks: {} };
    for (const [label, path] of checks) {
      const response = await request(path, auth);
      row.checks[label] = response.status;
      if (response.status !== 200) {
        await marker(`brand-check-${label}-status-${response.status}`);
        throw new Error(`authenticated brand smoke failed for ${path}: ${response.status}`);
      }
      await drain(response);
    }
    results.push(row);
  }
}

await marker(`brand-count-${results.length}`);
console.log(`MULTI_BRAND_COUNT=${results.length}`);
console.log(`MULTI_BRAND_RESULTS=${JSON.stringify(results)}`);
if (results.length < 2) throw new Error(`multi-brand smoke requires at least 2 existing brands but found ${results.length}`);
await marker("multi-brand-read-pass");
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
async function marker(value) {
  try { await fetch(`${base}/__smoke/${slug(value)}`, { redirect: "manual" }); } catch {}
}
function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120) || "empty";
}
async function drain(response) {
  try { await response.arrayBuffer(); } catch {}
}
