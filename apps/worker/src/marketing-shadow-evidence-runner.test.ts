import { describe, expect, it } from "vitest";
import type { AgentInvocationRequest, AgentRuntimePort } from "@kairo/agent-contracts";
import type { CarouselPlan } from "@kairo/domain/creative-formats";
import { marketingEvidenceRuntimeRoute, runMarketingShadowPairedEvidence } from "./marketing-shadow-evidence-runner";

const runtime: AgentRuntimePort = {
  async invoke<TOutput>(request: AgentInvocationRequest) {
    const benchmarkCase = request.task.context.benchmarkCase as {
      claims: Array<{ id: string }>;
      requiredClaimIds: string[];
    };
    const ids = benchmarkCase.requiredClaimIds;
    const output: CarouselPlan = {
      format: "carousel",
      coverHook: "Choose for your use case",
      slides: [
        { headline: "Start with your needs", body: "Compare the trade-offs that matter to you.", supportingClaimIds: ids },
        { headline: "Avoid universal winners", body: "Different riders can prioritize different things.", supportingClaimIds: ids },
        { headline: "Save your checklist", body: "Use the supplied considerations before deciding.", supportingClaimIds: ids },
      ],
      caption: "A claim-linked comparison checklist.",
      cta: "Save this for your comparison.",
      supportingClaimIds: ids,
    };
    return {
      output: output as TOutput,
      metadata: {
        runtime: "hermes",
        runtimeVersion: "hermes-agent@test",
        provider: "test-provider",
        model: "test-model",
        inputTokens: 10,
        outputTokens: 20,
        costUsd: 0.001,
        pricingVersion: "test-pricing",
        latencyMs: 5,
      },
    };
  },
};

describe("VS-23 paired shadow evidence runner", () => {
  it("fails closed when the fetched Corey snapshot does not match the pinned Git blob", async () => {
    const fakeFetch: typeof fetch = async () => new Response("tampered skill", { status: 200 });
    await expect(runMarketingShadowPairedEvidence(runtime, fakeFetch)).rejects.toThrow(/blob hash/i);
  });

  it("fails closed when the pinned Corey source cannot be fetched", async () => {
    const fakeFetch: typeof fetch = async () => new Response("missing", { status: 503 });
    await expect(runMarketingShadowPairedEvidence(runtime, fakeFetch)).rejects.toThrow(/503/);
  });

  it("requires an explicit Hermes provider/model/pricing route for qualification evidence", () => {
    expect(() => marketingEvidenceRuntimeRoute({
      runtime: "direct-model",
      provider: "test-provider",
      model: "test-model",
      pricingVersion: "test-pricing",
      latencyMs: 1,
    }, "case:native")).toThrow(/Hermes runtime evidence/i);

    expect(() => marketingEvidenceRuntimeRoute({
      runtime: "hermes",
      runtimeVersion: "hermes-agent@test",
      provider: "test-provider",
      model: "test-model",
      latencyMs: 1,
    }, "case:native")).toThrow(/pricingVersion metadata/i);
  });
});
