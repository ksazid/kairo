import { spawn, spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import process from "node:process";

const chromeCandidates = [process.env.CHROME_BIN, "google-chrome", "google-chrome-stable", "chromium-browser", "chromium"].filter(Boolean);
const outputDir = process.argv[2] ?? "artifacts/flow-1b-brain";
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
  "--remote-debugging-port=9223",
  "--user-data-dir=/tmp/kairo-flow-1b-chrome",
  "about:blank",
], { stdio: ["ignore", "pipe", "pipe"] });
const stderr = [];
chrome.stderr.on("data", (chunk) => stderr.push(String(chunk)));

try {
  await waitFor(async () => {
    const response = await fetch("http://127.0.0.1:9223/json/version").catch(() => null);
    return response?.ok ? response : null;
  }, 20000, "Chrome DevTools endpoint");

  const captures = [];
  captures.push(await capture({ name: "brain-desktop-1440x1200", width: 1440, height: 1200, mobile: false, openEditor: false }));
  captures.push(await capture({ name: "brain-editor-1440x1200", width: 1440, height: 1200, mobile: false, openEditor: true }));
  captures.push(await capture({ name: "brain-mobile-390x844", width: 390, height: 844, mobile: true, openEditor: false }));
  await writeFile(`${outputDir}/dom-evidence.json`, JSON.stringify({ executable, captures }, null, 2));
} finally {
  chrome.kill("SIGTERM");
}

async function capture({ name, width, height, mobile, openEditor }) {
  const targetResponse = await fetch("http://127.0.0.1:9223/json/new?about:blank", { method: "PUT" });
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
    await send("Emulation.setEmulatedMedia", { media: "screen", features: [{ name: "prefers-color-scheme", value: "dark" }] });
    const cookie = await send("Network.setCookie", { name: "kairo_access_token", value: "flow-1b-ui-token", url: "http://127.0.0.1:3000/", path: "/", httpOnly: true, sameSite: "Lax" });
    if (cookie.success === false) throw new Error("Unable to set Kairo session cookie");
    await send("Page.navigate", { url: "http://127.0.0.1:3000/brain?brand=brand-ui" });
    await waitFor(async () => {
      const result = await send("Runtime.evaluate", { expression: "document.readyState === 'complete' && document.body.innerText.includes('Brand Brain') && document.body.innerText.includes('Ready for Hunter')", returnByValue: true }).catch(() => null);
      return result?.result?.value === true;
    }, 30000, `${name} page load`);
    await send("Runtime.evaluate", { expression: "document.fonts && document.fonts.ready ? document.fonts.ready.then(() => true) : true", awaitPromise: true, returnByValue: true });
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (openEditor) {
      const opened = await send("Runtime.evaluate", {
        expression: `(() => { const button=[...document.querySelectorAll('button')].find((el)=>el.textContent?.trim()==='Edit'); if(!button)return false; button.click(); return true; })()`,
        returnByValue: true,
      });
      if (!opened.result?.value) throw new Error("Unable to open Brand Brain inline editor");
      await waitFor(async () => {
        const result = await send("Runtime.evaluate", { expression: "!!document.querySelector('[role=dialog]') && document.body.innerText.includes('Save & confirm')", returnByValue: true }).catch(() => null);
        return result?.result?.value === true;
      }, 10000, `${name} editor`);
    }

    const result = await send("Runtime.evaluate", { expression: evidenceExpression(), returnByValue: true });
    const dom = result.result?.value;
    if (!dom) throw new Error(`Unable to collect DOM evidence for ${name}: ${JSON.stringify(result)}`);
    const screenshot = await send("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: false });
    await writeFile(`${outputDir}/${name}.png`, Buffer.from(screenshot.data, "base64"));
    return { name, width, height, mobile, openEditor, dom };
  } finally {
    ws.close();
    await fetch(`http://127.0.0.1:9223/json/close/${target.id}`).catch(() => null);
  }
}

function evidenceExpression() {
  return `(() => {
    const rect=(el)=>{if(!el)return null;const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};
    const text=(el)=>el?.textContent?.replace(/\\s+/g,' ').trim()||'';
    const sections=[...document.querySelectorAll('#brain-sections > article')];
    const metricCards=[...document.querySelectorAll('section[aria-label="Brand Brain status"] > article')];
    const navLinks=[...document.querySelectorAll('aside nav[aria-label="Primary navigation"] a')];
    const sourceLinks=[...document.querySelectorAll('a[target="_blank"]')];
    const dialog=document.querySelector('[role=dialog]');
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      scrollHeight: document.documentElement.scrollHeight,
      shell: rect(document.querySelector('.app-shell')),
      sidebar: rect(document.querySelector('.sidebar')),
      topbar: rect(document.querySelector('.topbar')),
      header: rect(document.querySelector('h1')?.parentElement?.parentElement),
      metrics: rect(document.querySelector('section[aria-label="Brand Brain status"]')),
      metricCards: metricCards.map(rect),
      mainLayout: rect(document.querySelector('#brain-sections')?.parentElement),
      brainSections: sections.map((section)=>({ rect: rect(section), text: text(section).slice(0,500) })),
      navLabels: navLinks.map(text),
      activeNav: text(document.querySelector('aside nav[aria-label="Primary navigation"] a.active')),
      sourceLinkCount: sourceLinks.length,
      dialog: rect(dialog),
      dialogText: text(dialog).slice(0,800),
      text: document.body.innerText.replace(/\\s+/g,' ').trim().slice(0,5000)
    };
  })()`;
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
