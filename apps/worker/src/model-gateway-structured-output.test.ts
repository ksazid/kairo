import { describe, expect, it, vi } from "vitest";
import { OpenAICompatibleModelGateway } from "./model-gateway";
import { responseFormatForOutputSchema } from "./model-output-schemas";

const pricing = {
  inputUsdPerMillionTokens: 0.15,
  outputUsdPerMillionTokens: 0.60,
  version: "groq-gpt-oss-120b-test",
};

describe("strict structured model output", () => {
  it("sends Groq GPT-OSS carousel requests with strict JSON Schema", async () => {
    const fetchImpl = vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body ?? "{}")) as {
        response_format?: {
          type?: string;
          json_schema?: { name?: string; strict?: boolean; schema?: Record<string, unknown> };
        };
      };
      expect(body.response_format?.type).toBe("json_schema");
      expect(body.response_format?.json_schema?.name).toBe("marketing_carousel_plan_1");
      expect(body.response_format?.json_schema?.strict).toBe(true);
      expect(body.response_format?.json_schema?.schema).toMatchObject({
        type: "object",
        required: ["format", "coverHook", "slides", "caption", "cta", "supportingClaimIds"],
        additionalProperties: false,
      });

      return new Response(JSON.stringify({
        model: "openai/gpt-oss-120b",
        choices: [{ message: { content: JSON.stringify({
          format: "carousel",
          coverHook: "Choose the right bike for your priorities",
          slides: [
            { headline: "Performance", body: "Compare the supplied performance claim.", supportingClaimIds: ["claim-1"] },
            { headline: "Comfort", body: "Compare the supplied comfort claim.", supportingClaimIds: ["claim-2"] },
            { headline: "Decision", body: "Match the claims to your priorities.", supportingClaimIds: ["claim-1", "claim-2"] },
          ],
          caption: "Compare the supplied claims before deciding.",
          cta: "Save this comparison.",
          supportingClaimIds: ["claim-1", "claim-2"],
        }) } }],
        usage: { prompt_tokens: 100, completion_tokens: 100 },
      }), { status: 200, headers: { "content-type": "application/json" } });
    });

    const gateway = new OpenAICompatibleModelGateway({
      provider: "groq",
      baseUrl: "https://api.groq.com/openai/v1",
      apiKey: "test-key",
      model: "openai/gpt-oss-120b",
      pricing,
      fetchImpl,
    });

    await gateway.generate({
      role: "strategist",
      scope: { visibility: "global-public" },
      policy: {
        qualityTier: "balanced",
        privacyClass: "global-public",
        maxCostUsd: 0.03,
        maxOutputTokens: 2_200,
        allowedProviders: ["groq"],
      },
      input: "Synthetic carousel benchmark input",
      outputSchema: { name: "marketing-carousel-plan", version: "1" },
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("keeps JSON object mode for unrelated schemas", () => {
    expect(responseFormatForOutputSchema("groq", "openai/gpt-oss-120b", { name: "content-draft", version: "1" })).toEqual({
      type: "json_object",
    });
  });

  it("keeps JSON object mode for providers or models without the certified Groq strict route", () => {
    expect(responseFormatForOutputSchema("openai", "openai/gpt-oss-120b", { name: "marketing-carousel-plan", version: "1" })).toEqual({ type: "json_object" });
    expect(responseFormatForOutputSchema("groq", "other-model", { name: "marketing-carousel-plan", version: "1" })).toEqual({ type: "json_object" });
  });
});
