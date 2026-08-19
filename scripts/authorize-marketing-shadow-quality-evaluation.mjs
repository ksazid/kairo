import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Client } from "pg";

const APPROVED_RUN_ID = "vs65-quality-evaluation-20260819-a";
const SOURCE_RUN_ID = "vs23-qualification-20260819-b";
const SOURCE_RELEASE_SHA = "c3b881d3f8294da2114128439ae2f2eb0fe3c2da";
const AUTHORIZATION_MIGRATION = "0022_marketing_shadow_evidence_authorizations.sql";
const RUN_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const SHA_PATTERN = /^[0-9a-f]{40}$/;

const requestedRunId = process.env.KAIRO_STARTUP_MARKETING_SHADOW_QUALITY_AUTHORIZATION?.trim() ?? "";
if (requestedRunId !== APPROVED_RUN_ID) {
  throw new Error(`Startup Marketing Lab quality authorization is not approved: ${requestedRunId || "<empty>"}`);
}
if (!RUN_ID_PATTERN.test(requestedRunId)) throw new Error("Approved Marketing Lab quality run ID is invalid");
if (process.env.KAIRO_MARKETING_SHADOW_QUALITY_EVALUATION_RUN?.trim() !== "1") {
  throw new Error("KAIRO_MARKETING_SHADOW_QUALITY_EVALUATION_RUN must be 1 before staging quality authorization");
}
if (process.env.KAIRO_MARKETING_SHADOW_EVIDENCE_RUN?.trim() === "1") {
  throw new Error("Benchmark evidence execution must be off during Marketing Lab quality authorization");
}
if (process.env.KAIRO_DIRECT_MODEL_PROVIDER_DIAGNOSTIC?.trim() === "1") {
  throw new Error("DirectModel provider diagnostic must be off during Marketing Lab quality authorization");
}
const evaluationRunId = process.env.KAIRO_MARKETING_SHADOW_QUALITY_EVALUATION_RUN_ID?.trim() ?? "";
if (evaluationRunId !== requestedRunId) {
  throw new Error("Startup quality authorization run ID must match KAIRO_MARKETING_SHADOW_QUALITY_EVALUATION_RUN_ID");
}

const releaseSha = process.env.KAIRO_RELEASE_SHA?.trim() ?? "";
if (!SHA_PATTERN.test(releaseSha)) throw new Error("KAIRO_RELEASE_SHA must be an exact lowercase 40-character SHA");
if (process.env.RENDER === "true") {
  const renderSha = process.env.RENDER_GIT_COMMIT?.trim() ?? "";
  if (!SHA_PATTERN.test(renderSha)) throw new Error("RENDER_GIT_COMMIT must be an exact lowercase 40-character SHA");
  if (renderSha !== releaseSha) throw new Error("Startup Marketing Lab quality authorization release SHA does not match RENDER_GIT_COMMIT");
}

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const migrationUrl = new URL(`../apps/api/migrations/${AUTHORIZATION_MIGRATION}`, import.meta.url);
const migrationSource = await readFile(migrationUrl, "utf8");
const expectedMigrationChecksum = createHash("sha256").update(migrationSource).digest("hex");

const client = new Client({ connectionString: databaseUrl });
await client.connect();
try {
  await client.query("begin");
  try {
    await client.query("select pg_advisory_xact_lock(hashtext($1))", ["kairo-marketing-shadow-evidence-authorization"]);

    const registry = await client.query("select to_regclass('public.kairo_schema_migrations') as registry");
    if (!registry.rows[0]?.registry) throw new Error("kairo_schema_migrations registry is missing");
    const migration = await client.query(
      "select checksum from kairo_schema_migrations where filename=$1",
      [AUTHORIZATION_MIGRATION],
    );
    if (!migration.rows[0]) throw new Error(`${AUTHORIZATION_MIGRATION} is not applied`);
    if (migration.rows[0].checksum !== expectedMigrationChecksum) {
      throw new Error(`${AUTHORIZATION_MIGRATION} checksum does not match the deployed repository`);
    }

    const source = await client.query(
      "select release_sha,status,evidence,failure_kind from marketing_shadow_evidence_runs where run_id=$1",
      [SOURCE_RUN_ID],
    );
    const sourceRow = source.rows[0];
    if (!sourceRow) throw new Error("Run-B source evidence is missing");
    if (sourceRow.release_sha !== SOURCE_RELEASE_SHA || sourceRow.status !== "completed" || sourceRow.failure_kind) {
      throw new Error("Run-B source evidence is not the approved completed evidence");
    }
    if (!sourceRow.evidence || sourceRow.evidence.schemaVersion !== 1 || sourceRow.evidence.evidenceKind !== "vs23-shadow-qualification-paired-execution" || !Array.isArray(sourceRow.evidence.pairs) || sourceRow.evidence.pairs.length !== 4) {
      throw new Error("Run-B source evidence has an unexpected schema or pair count");
    }

    const priorRun = await client.query(
      "select release_sha,status from marketing_shadow_evidence_runs where run_id=$1",
      [requestedRunId],
    );
    if (priorRun.rows[0]) {
      if (priorRun.rows[0].release_sha !== releaseSha) {
        throw new Error("Marketing Lab quality run ID is already bound to a different release SHA");
      }
      await client.query("commit");
      console.log(`Marketing Lab quality authorization not reinserted: run ${requestedRunId} already ${priorRun.rows[0].status}`);
    } else {
      const outstanding = await client.query(
        "select run_id,release_sha from marketing_shadow_evidence_authorizations order by authorized_at asc",
      );
      if (outstanding.rows.length > 1) throw new Error("More than one outstanding Marketing Lab authorization exists");
      const existing = outstanding.rows[0];
      if (existing) {
        if (existing.run_id !== requestedRunId || existing.release_sha !== releaseSha) {
          throw new Error("A different Marketing Lab authorization is already outstanding");
        }
        await client.query("commit");
        console.log(`Marketing Lab quality authorization already staged for ${requestedRunId} at ${releaseSha}`);
      } else {
        await client.query(
          "insert into marketing_shadow_evidence_authorizations(run_id,release_sha) values($1,$2)",
          [requestedRunId, releaseSha],
        );
        await client.query("commit");
        console.log(`Marketing Lab quality authorization staged for ${requestedRunId} at ${releaseSha}`);
      }
    }
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  }
} finally {
  await client.end();
}
