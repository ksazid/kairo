import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const approvedMigration = "0022_marketing_shadow_evidence_authorizations.sql";
const requestedMigration = process.env.KAIRO_STARTUP_MIGRATION?.trim();

if (requestedMigration) {
  if (requestedMigration !== approvedMigration) {
    throw new Error(`Startup migration is not approved: ${requestedMigration}`);
  }

  if (process.env.RENDER === "true") {
    const releaseSha = process.env.KAIRO_RELEASE_SHA?.trim();
    const renderSha = process.env.RENDER_GIT_COMMIT?.trim();
    if (!releaseSha || !/^[0-9a-f]{40}$/.test(releaseSha)) throw new Error("KAIRO_RELEASE_SHA must be an exact lowercase 40-character SHA");
    if (!renderSha || !/^[0-9a-f]{40}$/.test(renderSha)) throw new Error("RENDER_GIT_COMMIT must be an exact lowercase 40-character SHA");
    if (releaseSha !== renderSha) throw new Error("Startup migration release SHA does not match RENDER_GIT_COMMIT");
  }

  const migrationScript = fileURLToPath(new URL("./migrate-exact.mjs", import.meta.url));
  const exitCode = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [migrationScript], { stdio: "inherit", env: process.env });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (signal) reject(new Error(`Exact migration terminated by signal ${signal}`));
      else resolve(code ?? 1);
    });
  });

  if (exitCode !== 0) throw new Error(`Exact migration failed with exit code ${exitCode}`);
}

await import(new URL("../apps/api/dist/server.js", import.meta.url));
