import { Client } from "pg";

const APPROVED_RUN_ID = "vs23-qualification-20260819-b";
const APPROVED_EVIDENCE_RELEASE_SHA = "c3b881d3f8294da2114128439ae2f2eb0fe3c2da";
const RUN_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

const requestedRunId = process.env.KAIRO_STARTUP_MARKETING_SHADOW_EVIDENCE_EXPORT?.trim() ?? "";
if (requestedRunId !== APPROVED_RUN_ID) {
  throw new Error(`Marketing Lab evidence export is not approved: ${requestedRunId || "<empty>"}`);
}
if (!RUN_ID_PATTERN.test(requestedRunId)) throw new Error("Approved Marketing Lab evidence export run ID is invalid");

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const client = new Client({ connectionString: databaseUrl });
await client.connect();
try {
  const result = await client.query(
    `select run_id,release_sha,status,evidence,failure_kind,finished_at
     from marketing_shadow_evidence_runs
     where run_id=$1`,
    [requestedRunId],
  );
  const row = result.rows[0];
  if (!row) throw new Error("Approved Marketing Lab evidence run was not found");
  if (row.release_sha !== APPROVED_EVIDENCE_RELEASE_SHA) {
    throw new Error("Approved Marketing Lab evidence run is bound to an unexpected release SHA");
  }
  if (row.status !== "completed") {
    throw new Error(`Approved Marketing Lab evidence run is not completed: ${row.status}`);
  }
  if (row.failure_kind) throw new Error("Completed Marketing Lab evidence unexpectedly has a failure kind");

  const evidence = row.evidence;
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) {
    throw new Error("Completed Marketing Lab evidence payload is missing");
  }
  if (evidence.schemaVersion !== 1 || !Array.isArray(evidence.pairs) || evidence.pairs.length !== 4) {
    throw new Error("Completed Marketing Lab evidence payload has an unexpected schema or pair count");
  }

  console.log(JSON.stringify({
    marker: "KAIRO_MARKETING_SHADOW_EVIDENCE_EXPORT_HEADER",
    runId: requestedRunId,
    releaseSha: row.release_sha,
    status: row.status,
    finishedAt: row.finished_at,
    schemaVersion: evidence.schemaVersion,
    evidenceKind: evidence.evidenceKind,
    datasetId: evidence.datasetId,
    challengerSource: evidence.challengerSource,
    runtimeRoute: evidence.runtimeRoute,
    pairCount: evidence.pairs.length,
  }));

  for (let index = 0; index < evidence.pairs.length; index += 1) {
    console.log(JSON.stringify({
      marker: "KAIRO_MARKETING_SHADOW_EVIDENCE_EXPORT_PAIR",
      runId: requestedRunId,
      index,
      pair: evidence.pairs[index],
    }));
  }
} finally {
  await client.end();
}
