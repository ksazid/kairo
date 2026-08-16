import { describe, expect, it, vi } from "vitest";
import type { MarketingShadowEvidenceRun } from "@kairo/worker/marketing-shadow-evidence-runner";
import {
  executeMarketingShadowEvidenceAttempt,
  marketingShadowEvidenceRequestFromEnv,
  safeFailureKind,
  type MarketingShadowEvidenceRunStore,
} from "./marketing-shadow-evidence-run";

const request = {
  runId: "vs23-qualification-20260816-a",
  releaseSha: "a".repeat(40),
};

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
    runtime: "hermes",
    runtimeVersion: "hermes-agent@test",
    provider: "test-provider",
    model: "test-model",
    pricingVersion: "test-pricing",
  },
  pairs: [],
} satisfies MarketingShadowEvidenceRun;

describe("marketing shadow evidence attempt orchestration", () => {
  it("requires a unique run ID and exact release SHA only when the evidence flag is on", () => {
    expect(marketingShadowEvidenceRequestFromEnv({})).toBeNull();
    expect(() => marketingShadowEvidenceRequestFromEnv({
      KAIRO_MARKETING_SHADOW_EVIDENCE_RUN: "1",
      KAIRO_RELEASE_SHA: request.releaseSha,
    })).toThrow(/RUN_ID/);
    expect(() => marketingShadowEvidenceRequestFromEnv({
      KAIRO_MARKETING_SHADOW_EVIDENCE_RUN: "1",
      KAIRO_MARKETING_SHADOW_EVIDENCE_RUN_ID: request.runId,
      KAIRO_RELEASE_SHA: "short",
    })).toThrow(/40-character/);
    expect(marketingShadowEvidenceRequestFromEnv({
      KAIRO_MARKETING_SHADOW_EVIDENCE_RUN: "1",
      KAIRO_MARKETING_SHADOW_EVIDENCE_RUN_ID: request.runId,
      KAIRO_RELEASE_SHA: request.releaseSha,
    })).toEqual(request);
  });

  it("does not invoke Hermes again when the durable run ID was already claimed", async () => {
    const run = vi.fn();
    const store: MarketingShadowEvidenceRunStore = {
      claim: vi.fn().mockResolvedValue({ claimed: false, status: "started" }),
      complete: vi.fn(),
      fail: vi.fn(),
    };
    const result = await executeMarketingShadowEvidenceAttempt(store, {} as never, request, run as never);
    expect(result).toEqual({ kind: "skipped", priorStatus: "started" });
    expect(run).not.toHaveBeenCalled();
    expect(store.complete).not.toHaveBeenCalled();
    expect(store.fail).not.toHaveBeenCalled();
  });

  it("persists successful evidence and retries transient completion persistence", async () => {
    let completeAttempts = 0;
    const store: MarketingShadowEvidenceRunStore = {
      claim: vi.fn().mockResolvedValue({ claimed: true, status: "started" }),
      complete: vi.fn(async () => {
        completeAttempts += 1;
        if (completeAttempts < 3) throw new Error("temporary database failure");
      }),
      fail: vi.fn(),
    };
    const run = vi.fn().mockResolvedValue(evidence);
    const result = await executeMarketingShadowEvidenceAttempt(store, {} as never, request, run as never);
    expect(result).toEqual({ kind: "completed", evidence });
    expect(run).toHaveBeenCalledTimes(1);
    expect(store.complete).toHaveBeenCalledTimes(3);
    expect(store.fail).not.toHaveBeenCalled();
  });

  it("records only a bounded failure category when the model run fails", async () => {
    const failure = new Error("provider details must not be persisted");
    failure.name = "AgentRuntimeError";
    const store: MarketingShadowEvidenceRunStore = {
      claim: vi.fn().mockResolvedValue({ claimed: true, status: "started" }),
      complete: vi.fn(),
      fail: vi.fn(),
    };
    const run = vi.fn().mockRejectedValue(failure);
    await expect(executeMarketingShadowEvidenceAttempt(store, {} as never, request, run as never)).rejects.toBe(failure);
    expect(store.fail).toHaveBeenCalledWith(request.runId, "AgentRuntimeError");
    expect(store.complete).not.toHaveBeenCalled();
  });

  it("sanitizes unexpected failure names", () => {
    const failure = new Error("secret body");
    failure.name = "unsafe failure name with spaces";
    expect(safeFailureKind(failure)).toBe("unknown-error");
  });
});
