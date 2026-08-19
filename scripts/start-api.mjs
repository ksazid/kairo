import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const approvedMigration = "0022_marketing_shadow_evidence_authorizations.sql";
const approvedRange = "0017_multichannel_approvals.sql..0022_marketing_shadow_evidence_authorizations.sql";
const approvedMarketingAuthorization = "vs23-qualification-20260819-a";
const requestedMigration = process.env.KAIRO_STARTUP_MIGRATION?.trim();
const requestedRange = process.env.KAIRO_STARTUP_MIGRATION_RANGE?.trim();
const requestedMarketingAuthorization = process.env.KAIRO_STARTUP_MARKETING_SHADOW_AUTHORIZATION?.trim();

const startupMutationCount = [requestedMigration, requestedRange, requestedMarketingAuthorization].filter(Boolean).length;
if (startupMutationCount > 1) {
  throw new Error("Configure only one startup mutation: exact migration, migration range, or Marketing Lab authorization");
}

const startupMutationRequested = startupMutationCount === 1;
if (startupMutationRequested && process.env.RENDER === "true") {
  const releaseSha = process.env.KAIRO_RELEASE_SHA?.trim();
  const renderSha = process.env.RENDER_GIT_COMMIT?.trim();
  if (!releaseSha || !/^[0-9a-f]{40}$/.test(releaseSha)) throw new Error("KAIRO_RELEASE_SHA must be an exact lowercase 40-character SHA");
  if (!renderSha || !/^[0-9a-f]{40}$/.test(renderSha)) throw new Error("RENDER_GIT_COMMIT must be an exact lowercase 40-character SHA");
  if (releaseSha !== renderSha) throw new Error("Startup mutation release SHA does not match RENDER_GIT_COMMIT");
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
}

await import(new URL("../apps/api/dist/server.js", import.meta.url));