import { spawn, spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import process from "node:process";

const chromeCandidates = [process.env.CHROME_BIN, "google-chrome", "google-chrome-stable", "chromium-browser", "chromium"].filter(Boolean);
const outputDir = process.argv[2] ?? "artifacts/ui-fidelity";
const appUrl = "http://127.0.0.1:3000/?workspace=workspace-ui&brand=brand-ui";

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
  "--user-data-dir=/tmp/kairo-ui-fidelity-chrome",
  "about:blank",
], { stdio: ["ignore", "pipe", "pipe"] });

const stderr = [];
chrome.stderr.on("data", (chunk) => stderr.push(String(chunk)));
chrome.on("exit", (code, signal) => {
  if (code && code !== 0) stderr.push(`Chrome exited with code ${code} signal ${signal ?? "none"}`);
});

try {
  await waitFor(async () => {
    const response = await fetch("http://127.0.0.1:9222/json/version").catch(() => null);
    return response?.ok ? response : null;
  }, 20000, "Chrome DevTools endpoint");

  const evidence = [];
  evidence.push(await capture({ name: "home-desktop", width: 1440, height: 1100, mobile: false }));
  evidence.push(await capture({ name: "home-mobile", width: 390, height: 844, mobile: true }));
  await writeFile(`${outputDir}/dom-evidence.json`, JSON.stringify({ executable, appUrl, captures: evidence }, null, 2));
} finally {
  chrome.kill("SIGTERM");
}

async function capture({ name, width, height, mobile }) {
  const targetResponse = await fetch("http://127.0.0.1:9222/json/new?about:blank", { method: "PUT" });
  if (!targetResponse.ok) throw new Error(`Unable to create Chrome target for ${name}`);
  const target = await targetResponse.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  const pending = new Map();
  let nextId = 1;

  ws.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data));
    if (!message.id) return;
    const resolver = pending.get(message.id);
    if (!resolver) return;
    pending.delete(message.id);
    if (message.error) resolver.reject(new Error(message.error.message));
    else resolver.resolve(message.result ?? {});
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
    await send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile,
      screenWidth: width,
      screenHeight: height,
    });
    await send("Emulation.setEmulatedMedia", { media: "screen", features: [{ name: "prefers-color-scheme", value: "light" }] });
    const cookie = await send("Network.setCookie", {
      name: "kairo_access_token",
      value: "ui-fidelity-token",
      url: "http://127.0.0.1:3000/",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    });
    if (cookie.success === false) throw new Error("Unable to set Kairo session cookie");

    await send("Page.navigate", { url: appUrl });
    await waitFor(async () => {
      const result = await send("Runtime.evaluate", {
        expression: "document.readyState === 'complete' && !!document.querySelector('#kairo-main-content h1')",
        returnByValue: true,
      }).catch(() => null);
      return result?.result?.value === true;
    }, 30000, `${name} page load`);

    await send("Runtime.evaluate", {
      expression: "document.fonts && document.fonts.ready ? document.fonts.ready.then(() => true) : true",
      awaitPromise: true,
      returnByValue: true,
    });
    await new Promise((resolve) => setTimeout(resolve, 700));

    const dom = await send("Runtime.evaluate", {
      expression: `(() => ({
        title: document.querySelector('#kairo-main-content h1')?.textContent?.trim(),
        desktopNav: [...document.querySelectorAll('.k-shell-sidebar .k-shell-nav-item span')].map((el) => el.textContent?.trim()),
        mobileNav: [...document.querySelectorAll('.k-shell-mobile-nav-item span')].map((el) => el.textContent?.trim()),
        sections: [...document.querySelectorAll('#kairo-main-content section')].map((el) => el.textContent?.replace(/\\s+/g, ' ').trim().slice(0, 160)),
        bodyWidth: document.documentElement.scrollWidth,
        bodyHeight: document.documentElement.scrollHeight,
      }))()`,
      returnByValue: true,
    });

    const metrics = await send("Page.getLayoutMetrics");
    const contentSize = metrics.cssContentSize ?? metrics.contentSize;
    const clip = { x: 0, y: 0, width: Math.max(width, contentSize.width), height: Math.max(height, contentSize.height), scale: 1 };
    const screenshot = await send("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: true, clip });
    await writeFile(`${outputDir}/${name}.png`, Buffer.from(screenshot.data, "base64"));
    return { name, width, height, mobile, contentSize, dom: dom.result?.value };
  } finally {
    ws.close();
    await fetch(`http://127.0.0.1:9222/json/close/${target.id}`).catch(() => null);
  }
}

async function waitFor(check, timeoutMs, label) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const value = await check();
    if (value) return value;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${label}. Chrome stderr: ${stderr.slice(-10).join("")}`);
}
