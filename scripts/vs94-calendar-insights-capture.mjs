import { spawn, spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import process from "node:process";

const chromeCandidates = [process.env.CHROME_BIN, "google-chrome", "google-chrome-stable", "chromium-browser", "chromium"].filter(Boolean);
const outputDir = process.argv[2] ?? "artifacts/vs94-calendar-insights";
await mkdir(outputDir, { recursive: true });
const executable = chromeCandidates.find((candidate) => {
  const probe = spawnSync(candidate, ["--version"], { stdio: "ignore" });
  return !probe.error && probe.status === 0;
});
if (!executable) throw new Error(`Unable to find Chrome/Chromium. Tried: ${chromeCandidates.join(", ")}`);

const chrome = spawn(executable, [
  "--headless=new",
  "--no-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--remote-debugging-address=127.0.0.1",
  "--remote-debugging-port=9222",
  "--user-data-dir=/tmp/kairo-vs94-chrome",
  "about:blank",
], { stdio: ["ignore", "pipe", "pipe"] });
const stderr = [];
chrome.stderr.on("data", (chunk) => stderr.push(String(chunk)));

try {
  await waitFor(async () => {
    const response = await fetch("http://127.0.0.1:9222/json/version").catch(() => null);
    return response?.ok ? response : null;
  }, 20000, "Chrome DevTools endpoint");

  const captures = [];
  captures.push(await capture({
    name: "calendar-728x1536",
    url: "http://127.0.0.1:3000/brands/brand-ui/calendar?view=week&date=2023-04-27",
    width: 728,
    height: 1536,
    mobile: true,
    kind: "calendar",
  }));
  captures.push(await capture({
    name: "insights-728x1536",
    url: "http://127.0.0.1:3000/brands/brand-ui/performance?period=30",
    width: 728,
    height: 1536,
    mobile: true,
    kind: "insights",
  }));
  captures.push(await capture({
    name: "calendar-mobile-390x844",
    url: "http://127.0.0.1:3000/brands/brand-ui/calendar?view=week&date=2023-04-27",
    width: 390,
    height: 844,
    mobile: true,
    kind: "calendar",
  }));
  captures.push(await capture({
    name: "insights-mobile-390x844",
    url: "http://127.0.0.1:3000/brands/brand-ui/performance?period=30",
    width: 390,
    height: 844,
    mobile: true,
    kind: "insights",
  }));
  await writeFile(`${outputDir}/dom-evidence.json`, JSON.stringify({ executable, captures }, null, 2));
} finally {
  chrome.kill("SIGTERM");
}

async function capture({ name, url, width, height, mobile, kind }) {
  const targetResponse = await fetch("http://127.0.0.1:9222/json/new?about:blank", { method: "PUT" });
  if (!targetResponse.ok) throw new Error(`Unable to create target for ${name}`);
  const target = await targetResponse.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  const pending = new Map();
  let nextId = 1;
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data));
    if (!message.id) return;
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    message.error ? request.reject(new Error(message.error.message)) : request.resolve(message.result ?? {});
  });
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

  try {
    await send("Page.enable");
    await send("Network.enable");
    await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile, screenWidth: width, screenHeight: height });
    await send("Emulation.setEmulatedMedia", { media: "screen", features: [{ name: "prefers-color-scheme", value: "light" }] });
    const cookie = await send("Network.setCookie", { name: "kairo_access_token", value: "vs94-ui-token", url: "http://127.0.0.1:3000/", path: "/", httpOnly: true, sameSite: "Lax" });
    if (cookie.success === false) throw new Error("Unable to set Kairo session cookie");
    await send("Page.navigate", { url });
    await waitFor(async () => {
      const result = await send("Runtime.evaluate", { expression: "document.readyState === 'complete' && !!document.querySelector('#kairo-main-content')", returnByValue: true }).catch(() => null);
      return result?.result?.value === true;
    }, 30000, `${name} page load`);
    await send("Runtime.evaluate", { expression: "document.fonts && document.fonts.ready ? document.fonts.ready.then(() => true) : true", awaitPromise: true, returnByValue: true });
    await send("Runtime.evaluate", { expression: "Promise.all([...document.images].map(img => img.complete ? true : new Promise(r => { img.addEventListener('load', r, {once:true}); img.addEventListener('error', r, {once:true}); }))).then(() => true)", awaitPromise: true, returnByValue: true });
    await new Promise((resolve) => setTimeout(resolve, 650));

    const expression = kind === "calendar" ? calendarEvidenceExpression() : insightsEvidenceExpression();
    const result = await send("Runtime.evaluate", { expression, returnByValue: true });
    const dom = result.result?.value;
    if (!dom) throw new Error(`Unable to collect DOM evidence for ${name}: ${JSON.stringify(result)}`);
    const screenshot = await send("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: false });
    await writeFile(`${outputDir}/${name}.png`, Buffer.from(screenshot.data, "base64"));
    return { name, url, width, height, mobile, kind, dom };
  } finally {
    ws.close();
    await fetch(`http://127.0.0.1:9222/json/close/${target.id}`).catch(() => null);
  }
}

function commonPrelude() {
  return `const rect=(el)=>{if(!el)return null;const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}}; const one=(s)=>rect(document.querySelector(s)); const many=(s)=>[...document.querySelectorAll(s)].map(rect);`;
}

function calendarEvidenceExpression() {
  return `(() => { ${commonPrelude()} const cards=[...document.querySelectorAll('a[aria-label^="Open "][aria-label$=" preview"]')]; return {
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    scrollHeight: document.documentElement.scrollHeight,
    header: one('.k-shell-mobile-header'),
    bottomNav: one('.k-shell-mobile-nav'),
    main: one('#kairo-main-content'),
    title: one('#kairo-main-content h1'),
    controls: one('section[aria-label="Calendar controls"]'),
    viewTabs: one('nav[aria-label="Calendar view"]'),
    weekStrip: one('nav[aria-label*="–"]'),
    dayGroups: many('section[id^="agenda-"]'),
    cards: cards.map(rect),
    thumbnails: many('a[aria-label^="Open "] [class*="thumbnail"]'),
    cardHrefs: cards.map(a => a.getAttribute('href')),
    navItems: many('.k-shell-mobile-nav-item'),
    text: document.querySelector('#kairo-main-content')?.innerText?.replace(/\\s+/g,' ').trim().slice(0,2600) || ''
  }; })()`;
}

function insightsEvidenceExpression() {
  return `(() => { ${commonPrelude()} return {
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    scrollHeight: document.documentElement.scrollHeight,
    header: one('.k-shell-mobile-header'),
    bottomNav: one('.k-shell-mobile-nav'),
    main: one('#kairo-main-content'),
    title: one('#kairo-main-content h1'),
    period: one('details[class*="periodControl"] > summary'),
    whatHappened: one('section[aria-labelledby="what-happened-title"]'),
    metricCards: many('article[class*="metricCard"]'),
    trendPanel: one('section[aria-labelledby="engagement-trend-title"]'),
    chart: one('[class*="chartWrap"]'),
    whySection: one('section[aria-labelledby="why-title"]'),
    patternCards: many('article[class*="patternCard"]'),
    nextSection: one('section[aria-labelledby="next-title"]'),
    nextCard: one('article[class*="nextCard"]'),
    navItems: many('.k-shell-mobile-nav-item'),
    text: document.querySelector('#kairo-main-content')?.innerText?.replace(/\\s+/g,' ').trim().slice(0,2600) || ''
  }; })()`;
}

async function waitFor(check, timeoutMs, label) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const value = await check();
    if (value) return value;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${label}: ${stderr.slice(-8).join("")}`);
}
