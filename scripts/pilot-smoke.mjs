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
const requirePublishedFlow=process.env.KAIRO_SMOKE_REQUIRE_PUBLISHED_FLOW==="1";
const requirePublishedCarousel=process.env.KAIRO_SMOKE_REQUIRE_PUBLISHED_CAROUSEL==="1";
if(requireAuth&&!token)throw new Error("KAIRO_SMOKE_TOKEN is required when KAIRO_SMOKE_REQUIRE_AUTH=1");

if(token){
  const auth={authorization:`Bearer ${token}`};
  const session=await request("/api/v1/session",auth);
  if(session.status!==200)throw new Error(`session smoke failed: ${session.status}`);
  const body=await session.json();
  if(!body?.account?.id||!Array.isArray(body?.workspaces))throw new Error("session smoke returned an invalid shape");

  let verifiedBrands=0,verifiedPublishedFlows=0;
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
        `/api/v1/brands/${encodeURIComponent(brand.id)}/ideas`,
        `/api/v1/brands/${encodeURIComponent(brand.id)}/campaigns`,
        `/api/v1/brands/${encodeURIComponent(brand.id)}/calendar`,
        `/api/v1/brands/${encodeURIComponent(brand.id)}/performance`,
        `/api/v1/brands/${encodeURIComponent(brand.id)}/learnings`,
        `/api/v1/brands/${encodeURIComponent(brand.id)}/channels/meta/health`
      ]){
        const response=await request(path,auth);
        if(response.status!==200)throw new Error(`authenticated smoke failed for ${path}: ${response.status}`);
      }
      if(requirePublishedFlow){
        const campaignsResponse=await request(`/api/v1/brands/${encodeURIComponent(brand.id)}/campaigns`,auth),campaigns=await campaignsResponse.json();
        let verified=false;
        for(const campaign of campaigns){
          const detailResponse=await request(`/api/v1/brands/${encodeURIComponent(brand.id)}/campaigns/${encodeURIComponent(campaign.id)}`,auth);
          if(detailResponse.status!==200)throw new Error(`campaign detail smoke failed for Brand ${brand.id}`);
          const detail=await detailResponse.json();
          for(const entry of detail?.assets??[]){
            const assetId=entry?.asset?.id;if(!assetId)continue;
            const flowResponse=await request(`/api/v1/brands/${encodeURIComponent(brand.id)}/campaigns/${encodeURIComponent(campaign.id)}/assets/${encodeURIComponent(assetId)}/review-publish-results`,auth);
            if(flowResponse.status!==200)continue;
            const flow=await flowResponse.json();
            if(flow?.brandId!==brand.id||flow?.campaignId!==campaign.id||flow?.assetId!==assetId)throw new Error("Brand → Publish flow returned cross-scope lineage");
            const published=flow?.review?.status==="ready"&&flow?.result?.status==="published"&&flow?.result?.publishId&&flow?.performance?.status==="available";
            const exactCarousel=!requirePublishedCarousel||(flow?.review?.contentType==="carousel"&&flow?.review?.itemCount>=2&&flow?.review?.approvedAssetVersionId&&flow?.review?.quality?.blockingIssues===0&&flow?.result?.publishedUrl);
            if(published&&exactCarousel){
              if(requirePublishedCarousel){if(!Array.isArray(flow.review.previewUrls)||flow.review.previewUrls.length!==flow.review.itemCount)throw new Error("Published Carousel preview lineage is incomplete");for(const url of flow.review.previewUrls){const media=await fetch(url,{headers:{range:"bytes=0-0"},redirect:"follow"});if(!media.ok||!media.headers.get("content-type")?.toLowerCase().startsWith("image/"))throw new Error(`Approved Carousel media delivery failed: ${media.status}`)}}
              verified=true;verifiedPublishedFlows++;break;
            }
          }
          if(verified)break;
        }
        if(!verified)throw new Error(`Brand ${brand.id} has no approved → published${requirePublishedCarousel?" Carousel":""} → Results lineage to verify`);
      }
      verifiedBrands+=1;
    }
    if(verifiedBrands>=2)break;
  }
  if(requireMultiBrand&&verifiedBrands<2)throw new Error(`authenticated multi-Brand smoke requires 2 accessible Brands; verified ${verifiedBrands}`);
  if(requirePublishedFlow&&verifiedPublishedFlows<Math.min(2,verifiedBrands))throw new Error(`authenticated Brand → Publish smoke requires published Results lineage for each verified Brand; verified ${verifiedPublishedFlows}`);
}

console.log(`pilot smoke passed for ${expectedSha}${webBase?" across API and web":" on API"}`);

function required(name){const value=process.env[name]?.trim();if(!value)throw new Error(`${name} is required`);return value}
async function request(path,headers={}){return fetch(`${base}${path}`,{headers})}
async function expectJson(path,status,shape){const response=await request(path);if(response.status!==status)throw new Error(`${path} returned ${response.status}`);const body=await response.json();for(const[key,value]of Object.entries(shape)){if(body?.[key]!==value)throw new Error(`${path} returned unexpected ${key}`)}}
