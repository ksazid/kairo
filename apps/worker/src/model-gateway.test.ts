import { describe, expect, it, vi } from "vitest";
import { OpenAICompatibleModelGateway, openAICompatibleGatewayFromEnv } from "./model-gateway";

const request = {
  role: "hunter" as const,
  scope: { visibility: "global-public" as const },
  policy: {
    qualityTier: "balanced" as const,
    privacyClass: "global-public" as const,
    maxCostUsd: 0.05,
    maxOutputTokens: 500,
    allowedProviders: ["openai"],
  },
  input: "Rank these public signals.",
  outputSchema: { name: "hunter-ranking", version: "1" },
};

describe("OpenAICompatibleModelGateway", () => {
  it("keeps the API key in the transport header only and does not invent cost", async () => {
    const apiKey = "test-secret-key";
    const fetchImpl = vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
      const serializedBody = String(init?.body ?? "");
      expect(serializedBody).not.toContain(apiKey);
      expect(JSON.stringify(request)).not.toContain(apiKey);
      expect(new Headers(init?.headers).get("authorization")).toBe(`Bearer ${apiKey}`);
      return new Response(JSON.stringify({
        model: "test-model-2026-08-01",
        choices: [{ message: { content: JSON.stringify({ accepted: true }) } }],
        usage: { prompt_tokens: 17, completion_tokens: 4 },
      }), { status: 200, headers: { "content-type": "application/json" } });
    });

    const gateway = new OpenAICompatibleModelGateway({ provider: "openai", baseUrl: "https://models.example.test/v1", apiKey, model: "test-model", fetchImpl });
    const result = await gateway.generate<{ accepted: boolean }>(request);
    expect(result.output).toEqual({ accepted: true });
    expect(result.metadata).toMatchObject({ provider: "openai", model: "test-model-2026-08-01", inputTokens: 17, outputTokens: 4 });
    expect("costUsd" in result.metadata).toBe(false);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("propagates provider-reported cost without estimating it locally", async () => {
    const gateway = new OpenAICompatibleModelGateway({
      provider: "openai",
      baseUrl: "https://models.example.test/v1",
      apiKey: "test-key",
      model: "test-model",
      fetchImpl: async () => new Response(JSON.stringify({
        model: "test-model",
        choices: [{ message: { content: JSON.stringify({ accepted: true }) } }],
        usage: { prompt_tokens: 20, completion_tokens: 8, cost: 0.0042 },
      }), { status: 200, headers: { "content-type": "application/json" } }),
    });
    const result = await gateway.generate<{ accepted: boolean }>(request);
    expect(result.metadata.costUsd).toBe(0.0042);
  });

  it("returns no gateway when no server-side LLM configuration exists", () => {
    expect(openAICompatibleGatewayFromEnv({})).toBeNull();
  });

  it("fails closed when only part of the server-side LLM configuration exists", () => {
    expect(() => openAICompatibleGatewayFromEnv({ KAIRO_LLM_API_KEY: "secret" })).toThrow(/configured together/);
  });
});
