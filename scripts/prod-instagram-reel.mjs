const base = required("KAIRO_API_URL").replace(/\/$/, "");
const expectedSha = required("KAIRO_RELEASE_SHA");
const token = required("KAIRO_SMOKE_TOKEN");
const videoUrl = required("KAIRO_INSTAGRAM_REEL_URL");
const auth = { authorization: `Bearer ${token}` };
const brandIdRaw = "f00f0ec6-53bb-40da-ac20-f4c2ecb381d7";
const campaignIdRaw = "d576f91a-63e3-422d-929e-e029466b3dbd";
const brandId = encodeURIComponent(brandIdRaw);
const campaignId = encodeURIComponent(campaignIdRaw);
const caption = `2026 KTM 390 Duke — three official KTM numbers worth knowing:\n\n398.7 cm³ displacement\n45 PS power\n39 Nm torque\n\nWhich one matters most to you on the road?\n\n#KTM390Duke #Duke390 #KTM #Motorcycles #TheDukeMan`;

for (const [path, expected] of [["/health/live", {status:"ok"}], ["/health/ready", {status:"ready"}], ["/version", {releaseSha: expectedSha}]]) {
  const {response, body} = await json(path);
  if (response.status !== 200) throw new Error(`${path} returned ${response.status}`);
  for (const [key,value] of Object.entries(expected)) if (body?.[key] !== value) throw new Error(`${path} expected ${key}=${value}, got ${body?.[key]}`);
}
console.log(`REEL_PUBLIC_SMOKE=PASS:${expectedSha}`);

const accounts = await array(`/api/v1/brands/${brandId}/channel-accounts`);
const targets = accounts.filter(a => a?.channel === "instagram" && a?.status === "connected" && Array.isArray(a?.capabilities) && a.capabilities.includes("publish-reel"));
if (targets.length !== 1) throw new Error(`Expected exactly one connected Instagram publish-reel target; found ${targets.length}`);
const target = targets[0];
console.log(`REEL_TARGET=PASS:${target.displayName}:${target.accountRef}`);

const media = await fetch(videoUrl, {redirect:"follow"});
if (!media.ok) throw new Error(`Reel media returned ${media.status}`);
const mediaType = media.headers.get("content-type") ?? "";
if (!mediaType.toLowerCase().includes("video")) throw new Error(`Reel media content-type is ${mediaType}`);
const bytes = await media.arrayBuffer();
if (bytes.byteLength < 1000) throw new Error("Reel media is unexpectedly small");
console.log(`REEL_MEDIA_PREFLIGHT=PASS:${mediaType}:${bytes.byteLength}`);

const created = await json(`/api/v1/brands/${brandId}/campaigns/${campaignId}/assets`, {
  method:"POST",
  body:{channel:"instagram",format:"reel",audience:"KTM 390 Duke riders and motorcycle enthusiasts",topic:"2026 KTM 390 Duke official specs Reel",hookType:"verified-spec",cta:"Which one matters most to you on the road?",content:caption}
});
if (created.response.status !== 201 || !Array.isArray(created.body?.assets)) throw new Error(`Reel asset creation failed: ${created.response.status}`);
const entry = created.body.assets.find(x => x?.asset?.topic === "2026 KTM 390 Duke official specs Reel" && x?.versions?.at(-1)?.content === caption);
if (!entry?.asset?.id || entry.asset.currentVersion !== 1) throw new Error("Could not identify Reel asset");
const assetId = encodeURIComponent(entry.asset.id);
console.log(`REEL_ASSET=PASS:${entry.asset.id}`);

let review = null;
for (let attempt = 0; attempt < 4; attempt += 1) {
  const r = await json(`/api/v1/brands/${brandId}/campaigns/${campaignId}/assets/${assetId}/review`, {
    method:"POST",
    body:{expectedVersion:1,brandContextVersion:`${brandIdRaw}@current`,revisionCycle:attempt}
  });
  if (r.response.status === 201) {
    review = r.body;
    if (review?.status === "passed") break;
    if (review?.status && review.status !== "passed") throw new Error(`Reel review did not pass: ${review.status}`);
  }
  if (attempt < 3) await sleep((attempt + 1) * 6000);
}
if (review?.status !== "passed") throw new Error("Reel review unavailable after retries");
console.log(`REEL_REVIEW=PASS:${entry.asset.id}`);

const approval = await json(`/api/v1/brands/${brandId}/campaigns/${campaignId}/assets/${assetId}/approve`, {
  method:"POST",
  body:{expectedVersion:1,destination:{channel:"instagram",accountRef:target.accountRef}}
});
if (approval.response.status !== 201 || !approval.body?.id) throw new Error(`Reel approval failed: ${approval.response.status}`);
console.log(`REEL_APPROVAL=PASS:${approval.body.id}`);

const scheduled = await json(`/api/v1/brands/${brandId}/campaigns/${campaignId}/assets/${assetId}/schedule`, {
  method:"POST",
  body:{channelAccountId:target.id,contentType:"reel",mediaItems:[{kind:"video",url:videoUrl}],options:{instagram:{shareToFeed:true}}}
});
if (scheduled.response.status !== 201 || !scheduled.body?.id) throw new Error(`Reel publish command failed: ${scheduled.response.status} ${JSON.stringify(scheduled.body)}`);
console.log(`REEL_PUBLISH_COMMAND=PASS:${scheduled.body.id}:${scheduled.body.status}`);

const commandId = scheduled.body.id;
for (let attempt = 0; attempt < 48; attempt += 1) {
  const calendar = await array(`/api/v1/brands/${brandId}/calendar`);
  const command = calendar.find(x => x?.id === commandId);
  if (!command) throw new Error("Reel command disappeared from Calendar");
  if (command.status === "published") {
    console.log(`REEL_META_PUBLISH=PASS:${commandId}:published`);
    const performance = await json(`/api/v1/brands/${brandId}/performance`);
    if (performance.response.status !== 200) throw new Error(`Performance returned ${performance.response.status}`);
    console.log("REEL_PERFORMANCE=PASS");
    console.log(`PRODUCTION_INSTAGRAM_REEL_E2E=PASS:${expectedSha}:${commandId}`);
    process.exit(0);
  }
  if (["failed","unknown","manual-required","cancelled"].includes(command.status)) throw new Error(`Instagram Reel provider publish ended ${command.status}`);
  if (attempt < 47) await sleep(5000);
}
throw new Error("Instagram Reel did not reach published within 240 seconds");

function required(name){const value=process.env[name]?.trim();if(!value)throw new Error(`${name} is required`);return value;}
async function json(path, init={}){const response=await fetch(`${base}${path}`,{...init,headers:{...auth,...(init.body!==undefined?{"content-type":"application/json"}:{}),...(init.headers??{})},body:init.body!==undefined?JSON.stringify(init.body):undefined,redirect:"manual"});let body=null;try{body=await response.json();}catch{}return{response,body};}
async function array(path){const {response,body}=await json(path);if(response.status!==200||!Array.isArray(body))throw new Error(`${path} did not return an array (${response.status})`);return body;}
function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
