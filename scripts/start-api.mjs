import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const approvedMigration = "0022_marketing_shadow_evidence_authorizations.sql";
const approvedRange = "0017_multichannel_approvals.sql..0022_marketing_shadow_evidence_authorizations.sql";
const approvedMarketingAuthorization = "vs23-qualification-20260820-d";
const approvedMarketingEvidenceExport = "vs23-qualification-20260820-d";
const approvedMarketingQualityAuthorization = "vs65-quality-evaluation-20260820-b";
const requestedMigration = process.env.KAIRO_STARTUP_MIGRATION?.trim();
const requestedRange = process.env.KAIRO_STARTUP_MIGRATION_RANGE?.trim();
const requestedMarketingAuthorization = process.env.KAIRO_STARTUP_MARKETING_SHADOW_AUTHORIZATION?.trim();
const requestedMarketingEvidenceExport = process.env.KAIRO_STARTUP_MARKETING_SHADOW_EVIDENCE_EXPORT?.trim();
const requestedMarketingQualityAuthorization = process.env.KAIRO_STARTUP_MARKETING_SHADOW_QUALITY_AUTHORIZATION?.trim();

const startupActionCount = [
  requestedMigration,
  requestedRange,
  requestedMarketingAuthorization,
  requestedMarketingEvidenceExport,
  requestedMarketingQualityAuthorization,
].filter(Boolean).length;
if (startupActionCount > 1) {
  throw new Error("Configure only one startup action: exact migration, migration range, Marketing Lab authorization, Marketing Lab evidence export, or Marketing Lab quality authorization");
}

const startupActionRequested = startupActionCount === 1;
if (startupActionRequested && process.env.RENDER === "true") {
  const releaseSha = process.env.KAIRO_RELEASE_SHA?.trim();
  const renderSha = process.env.RENDER_GIT_COMMIT?.trim();
  if (!releaseSha || !/^[0-9a-f]{40}$/.test(releaseSha)) throw new Error("KAIRO_RELEASE_SHA must be an exact lowercase 40-character SHA");
  if (!renderSha || !/^[0-9a-f]{40}$/.test(renderSha)) throw new Error("RENDER_GIT_COMMIT must be an exact lowercase 40-character SHA");
  if (releaseSha !== renderSha) throw new Error("Startup action release SHA does not match RENDER_GIT_COMMIT");
}

async function runStartupScript(scriptUrl, label) {
  const scriptPath = fileURLToPath(scriptUrl);
  const exitCode = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath], { stdio: "inherit", env: process.env });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (signal) reject(new Error(`${label} terminated by signal ${signal}`));
      else resolve(code ?? 1);
    });
  });
  if (exitCode !== 0) throw new Error(`${label} failed with exit code ${exitCode}`);
}

function runBackgroundScript(scriptUrl, label) {
  const scriptPath = fileURLToPath(scriptUrl);
  const child = spawn(process.execPath, [scriptPath], { stdio: "inherit", env: process.env });
  child.once("error", (error) => {
    console.error(`${label} failed to start: ${error instanceof Error ? error.name : "unknown-error"}`);
  });
  child.once("exit", (code, signal) => {
    if (signal) console.error(`${label} terminated by signal ${signal}`);
    else if ((code ?? 1) !== 0) console.error(`${label} failed with exit code ${code ?? 1}`);
  });
}

if (requestedMigration) {
  if (requestedMigration !== approvedMigration) throw new Error(`Startup migration is not approved: ${requestedMigration}`);
  await runStartupScript(new URL("./migrate-exact.mjs", import.meta.url), `exact migration ${requestedMigration}`);
} else if (requestedRange) {
  if (requestedRange !== approvedRange) throw new Error(`Startup migration range is not approved: ${requestedRange}`);
  await runStartupScript(new URL("./migrate-range.mjs", import.meta.url), `migration range ${requestedRange}`);
} else if (requestedMarketingAuthorization) {
  if (requestedMarketingAuthorization !== approvedMarketingAuthorization) {
    throw new Error(`Startup Marketing Lab authorization is not approved: ${requestedMarketingAuthorization}`);
  }
  await runStartupScript(
    new URL("./authorize-marketing-shadow-evidence.mjs", import.meta.url),
    `Marketing Lab authorization ${requestedMarketingAuthorization}`,
  );
} else if (requestedMarketingEvidenceExport) {
  if (requestedMarketingEvidenceExport !== approvedMarketingEvidenceExport) {
    throw new Error(`Startup Marketing Lab evidence export is not approved: ${requestedMarketingEvidenceExport}`);
  }
  await runStartupScript(
    new URL("./export-marketing-shadow-evidence.mjs", import.meta.url),
    `Marketing Lab evidence export ${requestedMarketingEvidenceExport}`,
  );
} else if (requestedMarketingQualityAuthorization) {
  if (requestedMarketingQualityAuthorization !== approvedMarketingQualityAuthorization) {
    throw new Error(`Startup Marketing Lab quality authorization is not approved: ${requestedMarketingQualityAuthorization}`);
  }
  await runStartupScript(
    new URL("./authorize-marketing-shadow-quality-evaluation.mjs", import.meta.url),
    `Marketing Lab quality authorization ${requestedMarketingQualityAuthorization}`,
  );
  runBackgroundScript(
    new URL("../apps/api/dist/marketing-shadow-quality-evaluation-worker.js", import.meta.url),
    `Marketing Lab quality evaluation ${requestedMarketingQualityAuthorization}`,
  );
}

await import(new URL("../apps/api/dist/server.js", import.meta.url));
