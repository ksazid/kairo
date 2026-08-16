import type { OutputSchemaRef } from "@kairo/agent-contracts";

export type OpenAICompatibleResponseFormat =
  | { type: "json_object" }
  | {
      type: "json_schema";
      json_schema: {
        name: string;
        strict: true;
        schema: Record<string, unknown>;
      };
    };

const CAROUSEL_PLAN_SCHEMA = Object.freeze({
  type: "object",
  properties: {
    format: { type: "string", enum: ["carousel"] },
    coverHook: { type: "string" },
    slides: {
      type: "array",
      items: {
        type: "object",
        properties: {
          headline: { type: "string" },
          body: { type: "string" },
          supportingClaimIds: { type: "array", items: { type: "string" } },
        },
        required: ["headline", "body", "supportingClaimIds"],
        additionalProperties: false,
      },
    },
    caption: { type: "string" },
    cta: { type: "string" },
    supportingClaimIds: { type: "array", items: { type: "string" } },
  },
  required: ["format", "coverHook", "slides", "caption", "cta", "supportingClaimIds"],
  additionalProperties: false,
});

const GROQ_STRICT_MODELS = new Set(["openai/gpt-oss-20b", "openai/gpt-oss-120b"]);

export function responseFormatForOutputSchema(
  provider: string,
  model: string,
  outputSchema: OutputSchemaRef,
): OpenAICompatibleResponseFormat {
  if (
    provider === "groq"
    && GROQ_STRICT_MODELS.has(model)
    && outputSchema.name === "marketing-carousel-plan"
    && outputSchema.version === "1"
  ) {
    return {
      type: "json_schema",
      json_schema: {
        name: "marketing_carousel_plan_1",
        strict: true,
        schema: CAROUSEL_PLAN_SCHEMA,
      },
    };
  }
  return { type: "json_object" };
}
