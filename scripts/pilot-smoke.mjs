const base=required("KAIRO_API_URL").replace(/\/$/,"");
const expectedSha=required("KAIRO_RELEASE_SHA");
if(!/^[0-9a-f]{40}$/i.test(expectedSha))throw new Error("KAIRO_RELEASE_SHA must be an exact Git SHA");

await expectJson("/health/live",200,{status:"ok"});
await expectJson("/health/ready",200,{status:"ready"});
await expectJson("/version",200,{releaseSha:expectedSha});

const token=process.env.KAIRO_SMOKE_TOKEN?.trim();
if(token){
  const session=await request("/api/v1/session",{authorization:`Bearer ${token}`});
  if(session.status!==200)throw new Error(`session smoke failed: ${session.status}`);
  const body=await session.json();
  if(!body?.account?.id||!Array.isArray(body?.workspaces))throw new Error("session smoke returned an invalid shape");

  const workspace=body.workspaces[0];
  if(workspace?.id){
    const brands=await request(`/api/v1/workspaces/${encodeURIComponent(workspace.id)}/brands`,{authorization:`Bearer ${token}`});
    if(brands.status!==200)throw new Error(`brand listing smoke failed: ${brands.status}`);
    const list=await brands.json();
    const brand=Array.isArray(list)?list[0]:null;
    if(brand?.id){
      for(const path of [
        `/api/v1/brands/${encodeURIComponent(brand.id)}`,
        `/api/v1/brands/${encodeURIComponent(brand.id)}/brain`,
        `/api/v1/brands/${encodeURIComponent(brand.id)}/sources`
      ]){
        const response=await request(path,{authorization:`Bearer ${token}`});
        if(response.status!==200)throw new Error(`authenticated smoke failed for ${path}: ${response.status}`);
      }
    }
  }
}

console.log(`pilot smoke passed for ${expectedSha}`);

function required(name){const value=process.env[name]?.trim();if(!value)throw new Error(`${name} is required`);return value}
async function request(path,headers={}){return fetch(`${base}${path}`,{headers})}
async function expectJson(path,status,shape){const response=await request(path);if(response.status!==status)throw new Error(`${path} returned ${response.status}`);const body=await response.json();for(const[key,value]of Object.entries(shape)){if(body?.[key]!==value)throw new Error(`${path} returned unexpected ${key}`)}}
