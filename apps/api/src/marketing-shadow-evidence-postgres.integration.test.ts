import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { MarketingShadowEvidenceRun } from "@kairo/worker/marketing-shadow-evidence-runner";
import { PgMarketingShadowEvidenceRunStore } from "./marketing-shadow-evidence-run";

const url = process.env.TEST_DATABASE_URL;
const suite = url ? describe : describe.skip;

suite("PostgreSQL marketing shadow evidence run store", () => {
  const pool = new Pool({ connectionString: url });
  const store = new PgMarketingShadowEvidenceRunStore(pool);
  const releaseSha = "a".repeat(40);

  beforeAll(async () => {
    const exists = await pool.query<{ name: string | null }>("select to_regclass('public.marketing_shadow_evidence_runs')::text name");
    if (!exists.rows[0]?.name) {
      await pool.query(await readFile(new URL("../migrations/0016_marketing_shadow_evidence_runs.sql", import.meta.url), "utf8"));
    }
  });
  beforeEach(() => pool.query("truncate marketing_shadow_evidence_runs"));
  afterAll(() => pool.end());

  it("allows exactly one claim for a run ID across concurrent or repeated process starts", async () => {
    const claims = await Promise.all([
      store.claim("vs23-run-a", releaseSha),
      store.claim("vs23-run-a", releaseSha),
    ]);
    expect(claims.filter((claim) => claim.claimed)).toHaveLength(1);
    expect(claims.filter((claim) => !claim.claimed)).toHaveLength(1);
    await expect(store.claim("vs23-run-a", releaseSha)).resolves.toEqual({ claimed: false, status: "started" });
    await expect(store.claim("vs23-run-a", "b".repeat(40))).rejects.toThrow(/different release SHA/);
  });

  it("persists completed synthetic evidence for later blind scoring", async () => {
    const evidence = {
      schemaVersion: 1,
      evidenceKind: "vs23-shadow-qualification-paired-execution",
      datasetId: "marketing-lab-cross-sector-synthetic-fixtures",
      challengerSource: {
        repository: "coreyhaines31/marketingskills",
        commitSha: "b".repeat(40),
        path: "skills/social/SKILL.md",
        blobSha: "c".repeat(40),
      },
      runtimeRoute: {
        runtime: "direct-model",
        provider: "test-provider",
        model: "test-model",
        pricingVersion: "test-pricing",
      },
      pairs: [],
    } satisfies MarketingShadowEvidenceRun;

    await store.claim("vs23-run-complete", releaseSha);
    await store.complete("vs23-run-complete", evidence);
    const row = await pool.query<{ status: string; evidence: MarketingShadowEvidenceRun; failure_kind: string | null }>(
      "select status,evidence,failure_kind from marketing_shadow_evidence_runs where run_id=$1",
      ["vs23-run-complete"],
    );
    expect(row.rows[0]).toMatchObject({ status: "completed", evidence, failure_kind: null });
    await expect(store.claim("vs23-run-complete", releaseSha)).resolves.toEqual({ claimed: false, status: "completed" });
  });

  it("persists only a safe failure category and consumes the failed attempt", async () => {
    await store.claim("vs23-run-failed", releaseSha);
    await store.fail("vs23-run-failed", "AgentRuntimeError");
    const row = await pool.query<{ status: string; evidence: unknown; failure_kind: string }>(
      "select status,evidence,failure_kind from marketing_shadow_evidence_runs where run_id=$1",
      ["vs23-run-failed"],
    );
    expect(row.rows[0]).toEqual({ status: "failed", evidence: null, failure_kind: "AgentRuntimeError" });
    await expect(store.claim("vs23-run-failed", releaseSha)).resolves.toEqual({ claimed: false, status: "failed" });
  });
});
