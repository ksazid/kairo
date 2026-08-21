const base=required("KAIRO_API_URL").replace(/\/$/,"");
const expectedSha=required("KAIRO_RELEASE_SHA");
if(!/^[0-9a-f]{40}$/i.test(expectedSha))throw new Error("KAIRO_RELEASE_SHA must be an exact Git SHA");

await expectJson("/health/live",200,{status:"ok"});
await expectJson("/health/ready",200,{status:"ready"});
await expectJson("/version",200,{releaseSha:expectedSha});

const webBase=process.env.KAIRO_WEB_URL?.trim().replace(/\/$/,"");
if(webBase){
  const response=await fetch(`${webBase}/api/version`,{headers:{accept:"application/json"}});
  if(response.status!==200)throw new Error(`web /api/version returned ${response.status}`);
  const body=await response.json();
  if(body?.releaseSha!==expectedSha)throw new Error(`web release SHA mismatch: expected ${expectedSha}, received ${body?.releaseSha??"missing"}`);
}

const token=process.env.KAIRO_SMOKE_TOKEN?.trim();
const requireAuth=process.env.KAIRO_SMOKE_REQUIRE_AUTH==="1";
const requireMultiBrand=process.env.KAIRO_SMOKE_REQUIRE_MULTI_BRAND==="1";
if(requireAuth&&!token)throw new Error("KAIRO_SMOKE_TOKEN is required when KAIRO_SMOKE_REQUIRE_AUTH=1");

if(token){
  const auth={authorization:`Bearer ${token}`};
  const session=await request("/api/v1/session",auth);
  if(session.status!==200)throw new Error(`session smoke failed: ${session.status}`);
  const body=await session.json();
  if(!body?.account?.id||!Array.isArray(body?.workspaces))throw new Error("session smoke returned an invalid shape");

  let verifiedBrands=0;
  for(const workspace of body.workspaces){
    if(!workspace?.id)continue;
    const brands=await request(`/api/v1/workspaces/${encodeURIComponent(workspace.id)}/brands`,auth);
    if(brands.status!==200)throw new Error(`brand listing smoke failed: ${brands.status}`);
    const list=await brands.json();
    if(!Array.isArray(list))throw new Error("brand listing smoke returned an invalid shape");
    for(const brand of list.slice(0,2)){
      if(!brand?.id)continue;
      for(const path of [
        `/api/v1/brands/${encodeURIComponent(brand.id)}`,
        `/api/v1/brands/${encodeURIComponent(brand.id)}/brain`,
        `/api/v1/brands/${encodeURIComponent(brand.id)}/sources`,
        `/api/v1/brands/${encodeURIComponent(brand.id)}/ideas`
      ]){
        const response=await request(path,auth);
        if(response.status!==200)throw new Error(`authenticated smoke failed for ${path}: ${response.status}`);
      }
      verifiedBrands+=1;
    }
    if(verifiedBrands>=2)break;
  }
  if(requireMultiBrand&&verifiedBrands<2)throw new Error(`authenticated multi-Brand smoke requires 2 accessible Brands; verified ${verifiedBrands}`);
}

console.log(`pilot smoke passed for ${expectedSha}${webBase?" across API and web":" on API"}`);

function required(name){const value=process.env[name]?.trim();if(!value)throw new Error(`${name} is required`);return value}
async function request(path,headers={}){return fetch(`${base}${path}`,{headers})}
async function expectJson(path,status,shape){const response=await request(path);if(response.status!==status)throw new Error(`${path} returned ${response.status}`);const body=await response.json();for(const[key,value]of Object.entries(shape)){if(body?.[key]!==value)throw new Error(`${path} returned unexpected ${key}`)}}
