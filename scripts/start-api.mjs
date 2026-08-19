import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const approvedMigration = "0022_marketing_shadow_evidence_authorizations.sql";
const approvedRange = "0017_multichannel_approvals.sql..0022_marketing_shadow_evidence_authorizations.sql";
const requestedMigration = process.env.KAIRO_STARTUP_MIGRATION?.trim();
const requestedRange = process.env.KAIRO_STARTUP_MIGRATION_RANGE?.trim();

if (requestedMigration && requestedRange) {
  throw new Error("Configure either KAIRO_STARTUP_MIGRATION or KAIRO_STARTUP_MIGRATION_RANGE, not both");
}

const migrationRequested = Boolean(requestedMigration || requestedRange);
if (migrationRequested && process.env.RENDER === "true") {
  const releaseSha = process.env.KAIRO_RELEASE_SHA?.trim();
  const renderSha = process.env.RENDER_GIT_COMMIT?.trim();
  if (!releaseSha || !/^[0-9a-f]{40}$/.test(releaseSha)) throw new Error("KAIRO_RELEASE_SHA must be an exact lowercase 40-character SHA");
  if (!renderSha || !/^[0-9a-f]{40}$/.test(renderSha)) throw new Error("RENDER_GIT_COMMIT must be an exact lowercase 40-character SHA");
  if (releaseSha !== renderSha) throw new Error("Startup migration release SHA does not match RENDER_GIT_COMMIT");
}

let migrationScript;
let migrationLabel;
if (requestedMigration) {
  if (requestedMigration !== approvedMigration) throw new Error(`Startup migration is not approved: ${requestedMigration}`);
  migrationScript = new URL("./migrate-exact.mjs", import.meta.url);
  migrationLabel = `exact migration ${requestedMigration}`;
} else if (requestedRange) {
  if (requestedRange !== approvedRange) throw new Error(`Startup migration range is not approved: ${requestedRange}`);
  migrationScript = new URL("./migrate-range.mjs", import.meta.url);
  migrationLabel = `migration range ${requestedRange}`;
}

if (migrationScript) {
  const scriptPath = fileURLToPath(migrationScript);
  const exitCode = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath], { stdio: "inherit", env: process.env });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (signal) reject(new Error(`${migrationLabel} terminated by signal ${signal}`));
      else resolve(code ?? 1);
    });
  });
  if (exitCode !== 0) throw new Error(`${migrationLabel} failed with exit code ${exitCode}`);
}

await import(new URL("../apps/api/dist/server.js", import.meta.url));
