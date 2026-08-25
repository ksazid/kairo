import { spawn, spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import process from "node:process";

const chromeCandidates=[process.env.CHROME_BIN,"google-chrome","google-chrome-stable","chromium-browser","chromium"].filter(Boolean);
const outputDir=process.argv[2]??"artifacts/vs92-home";
const appUrl="http://127.0.0.1:3000/?workspace=workspace-ui&brand=brand-ui";
await mkdir(outputDir,{recursive:true});
const executable=chromeCandidates.find((candidate)=>{const probe=spawnSync(candidate,["--version"],{stdio:"ignore"});return !probe.error&&probe.status===0;});
if(!executable)throw new Error(`Unable to find Chrome/Chromium. Tried: ${chromeCandidates.join(", ")}`);
const chrome=spawn(executable,["--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu","--remote-debugging-address=127.0.0.1","--remote-debugging-port=9222","--user-data-dir=/tmp/kairo-vs92-chrome","about:blank"],{stdio:["ignore","pipe","pipe"]});
const stderr=[];chrome.stderr.on("data",(chunk)=>stderr.push(String(chunk)));
try{
 await waitFor(async()=>{const r=await fetch("http://127.0.0.1:9222/json/version").catch(()=>null);return r?.ok?r:null;},20000,"Chrome DevTools endpoint");
 const captures=[];
 captures.push(await capture({name:"home-mobile-393x852",width:393,height:852,mobile:true}));
 captures.push(await capture({name:"home-desktop-1440x1100",width:1440,height:1100,mobile:false}));
 await writeFile(`${outputDir}/dom-evidence.json`,JSON.stringify({executable,appUrl,captures},null,2));
}finally{chrome.kill("SIGTERM");}

async function capture({name,width,height,mobile}){
 const targetResponse=await fetch("http://127.0.0.1:9222/json/new?about:blank",{method:"PUT"});
 if(!targetResponse.ok)throw new Error(`Unable to create target for ${name}`);
 const target=await targetResponse.json();const ws=new WebSocket(target.webSocketDebuggerUrl);const pending=new Map();let nextId=1;
 ws.addEventListener("message",(event)=>{const m=JSON.parse(String(event.data));if(!m.id)return;const p=pending.get(m.id);if(!p)return;pending.delete(m.id);m.error?p.reject(new Error(m.error.message)):p.resolve(m.result??{});});
 await new Promise((resolve,reject)=>{ws.addEventListener("open",resolve,{once:true});ws.addEventListener("error",reject,{once:true});});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=nextId++;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 try{
  await send("Page.enable");await send("Network.enable");await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile,screenWidth:width,screenHeight:height});
  await send("Emulation.setEmulatedMedia",{media:"screen",features:[{name:"prefers-color-scheme",value:"light"}]});
  const cookie=await send("Network.setCookie",{name:"kairo_access_token",value:"vs92-ui-token",url:"http://127.0.0.1:3000/",path:"/",httpOnly:true,sameSite:"Lax"});if(cookie.success===false)throw new Error("Unable to set session cookie");
  await send("Page.navigate",{url:appUrl});
  await waitFor(async()=>{const r=await send("Runtime.evaluate",{expression:"document.readyState === 'complete' && !!document.querySelector('#kairo-main-content')",returnByValue:true}).catch(()=>null);return r?.result?.value===true;},30000,`${name} load`);
  await send("Runtime.evaluate",{expression:"document.fonts&&document.fonts.ready?document.fonts.ready.then(()=>true):true",awaitPromise:true,returnByValue:true});await new Promise(r=>setTimeout(r,500));
  const dom=await send("Runtime.evaluate",{expression:`(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,scrollHeight:document.documentElement.scrollHeight,clientHeight:document.documentElement.clientHeight,homeText:document.querySelector('#kairo-main-content')?.innerText?.replace(/\\s+/g,' ').trim().slice(0,1200),mobileHeader:getRect('.k-shell-mobile-header'),attention:getRect('[aria-label="Needs attention"] article'),idea:getRect('#my-idea'),forYou:getRect('[aria-labelledby="home-for-you-title"]'),working:getRect('[aria-labelledby="home-working-title"]'),bottomNav:getRect('.k-shell-mobile-nav'),toolCells:[...document.querySelectorAll('[aria-label="Idea sources"] button')].map(el=>rect(el)),metrics:[...document.querySelectorAll('[aria-label="Latest available Brand performance"] article')].map(el=>rect(el))}));function rect(el){const r=el.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}}function getRect(sel){const el=document.querySelector(sel);return el?rect(el):null}})()`,returnByValue:true});
  const shot=await send("Page.captureScreenshot",{format:"png",fromSurface:true,captureBeyondViewport:false});await writeFile(`${outputDir}/${name}.png`,Buffer.from(shot.data,"base64"));
  return {name,width,height,mobile,dom:dom.result?.value};
 }finally{ws.close();await fetch(`http://127.0.0.1:9222/json/close/${target.id}`).catch(()=>null);}
}
async function waitFor(check,timeoutMs,label){const start=Date.now();while(Date.now()-start<timeoutMs){const value=await check();if(value)return value;await new Promise(r=>setTimeout(r,250));}throw new Error(`Timed out waiting for ${label}: ${stderr.slice(-8).join("")}`);}
