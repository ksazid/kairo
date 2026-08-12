import { describe, expect, it } from "vitest";
import type {
  AgentInvocationRequest,
  ModelGatewayPort,
  ModelGatewayRequest,
  ModelGatewayResult,
} from "@kairo/agent-contracts";
import {
  AgentRuntimeError,
  AgentRuntimeRouter,
  DirectModelRuntime,
  HERMES_POLICY_FINGERPRINT,
  HermesBridgeRuntime,
} from "./agent-runtime";

const validOutput = { qualifies: true, relevance: 0.9 };
const validators = { "brand-relevance@1": (value: unknown) => Boolean(value && typeof value === "object" && "qualifies" in value) };

function request(): AgentInvocationRequest {
  return {
    role: "hunter",
    scope: { visibility: "brand-private", workspaceId: "workspace-1", brandId: "brand-1" },
    approvedContextVersion: "brand-1@2",
    capabilities: ["public-content-search"],
    task: {
      instruction: "Evaluate whether this evidence is worth developing.",
      context: { evidence: [{ title: "Agent runtimes", sourceUrl: "https://example.com/agents" }] },
    },
    outputSchema: { name: "brand-relevance", version: "1" },
    budget: { maxOutputTokens: 800, maxToolCalls: 2, maxCostUsd: 0.03, timeoutMs: 500 },
  };
}

function bridgeResponse(overrides: Record<string, unknown> = {}): Response {
  return new Response(JSON.stringify({
    policy: { fingerprint: HERMES_POLICY_FINGERPRINT, enabledTools: [], runtimeVersion: "pinned-test" },
    output: validOutput,
    metadata: { provider: "mock", model: "mock-model", inputTokens: 10, outputTokens: 5, costUsd: 0.001, latencyMs: 12 },
    ...overrides,
  }), { status: 200, headers: { "content-type": "application/json" } });
}

describe("VS-03 Hermes reasoning-only adapter", () => {
  it("sends no Kairo capability list or transport secret in the model-visible body", async () => {
    let body = "";
    let authorization = "";
    const runtime = new HermesBridgeRuntime({
      endpoint: "http://hermes.internal",
      serviceToken: "transport-secret",
      validators,
      fetchImpl: async (_input, init) => {
        body = String(init?.body ?? "");
        authorization = new Headers(init?.headers).get("authorization") ?? "";
        return bridgeResponse();
      },
    });

    const result = await runtime.invoke<typeof validOutput>(request());
    const parsed = JSON.parse(body) as Record<string, unknown>;
    expect(parsed.enabledTools).toEqual([]);
    expect(parsed).not.toHaveProperty("capabilities");
    expect(body).not.toContain("transport-secret");
    expect(authorization).toBe("Bearer transport-secret");
    expect(result.metadata.runtime).toBe("hermes");
  });

  it("fails closed when Hermes cannot attest the exact zero-tool policy", async () => {
    const runtime = new HermesBridgeRuntime({
      endpoint: "http://hermes.internal",
      serviceToken: "transport-secret",
      validators,
      fetchImpl: async () => bridgeResponse({
        policy: { fingerprint: HERMES_POLICY_FINGERPRINT, enabledTools: ["terminal"] },
      }),
    });
    await expect(runtime.invoke(request())).rejects.toThrow(/zero-tool profile/);

    const wrongPolicy = new HermesBridgeRuntime({
      endpoint: "http://hermes.internal",
      serviceToken: "transport-secret",
      validators,
      fetchImpl: async () => bridgeResponse({ policy: { fingerprint: "wrong", enabledTools: [] } }),
    });
    await expect(wrongPolicy.invoke(request())).rejects.toThrow(/fingerprint mismatch/);
  });

  it("rejects schema-invalid Hermes output", async () => {
    const runtime = new HermesBridgeRuntime({
      endpoint: "http://hermes.internal",
      serviceToken: "transport-secret",
      validators,
      fetchImpl: async () => bridgeResponse({ output: { unexpected: true } }),
    });
    await expect(runtime.invoke(request())).rejects.toThrow(/schema validation/);
  });

  it("falls back to DirectModelRuntime without changing the Hunter contract", async () => {
    class FakeGateway implements ModelGatewayPort {
      async generate<TOutput>(_request: ModelGatewayRequest): Promise<ModelGatewayResult<TOutput>> {
        return {
          output: validOutput as TOutput,
          metadata: { provider: "fixture", model: "direct", inputTokens: 8, outputTokens: 4, costUsd: 0, latencyMs: 3 },
        };
      }
    }
    const direct = new DirectModelRuntime({
      gateway: new FakeGateway(),
      validators,
      policy: () => ({ qualityTier: "balanced", privacyClass: "brand-private", maxCostUsd: 0.03, maxOutputTokens: 800, allowedProviders: ["fixture"] }),
    });
    const brokenHermes = new HermesBridgeRuntime({
      endpoint: "http://hermes.internal",
      serviceToken: "transport-secret",
      validators,
      fetchImpl: async () => bridgeResponse({ policy: { fingerprint: "wrong", enabledTools: [] } }),
    });

    const result = await new AgentRuntimeRouter(brokenHermes, direct).invoke<typeof validOutput>(request());
    expect(result.output).toEqual(validOutput);
    expect(result.metadata.runtime).toBe("direct-model");
  });
});
