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

const claimIdSchema = Object.freeze({ type: "string", minLength: 1, maxLength: 200 });
const claimIdsSchema = Object.freeze({
  type: "array",
  minItems: 1,
  items: claimIdSchema,
});

const CAROUSEL_PLAN_SCHEMA = Object.freeze({
  type: "object",
  properties: {
    format: { type: "string", enum: ["carousel"] },
    coverHook: { type: "string", minLength: 1, maxLength: 300 },
    slides: {
      type: "array",
      minItems: 3,
      maxItems: 20,
      items: {
        type: "object",
        properties: {
          headline: { type: "string", minLength: 1, maxLength: 240 },
          body: { type: "string", minLength: 1, maxLength: 2_000 },
          supportingClaimIds: claimIdsSchema,
        },
        required: ["headline", "body", "supportingClaimIds"],
        additionalProperties: false,
      },
    },
    caption: { type: "string", minLength: 1, maxLength: 5_000 },
    cta: { type: "string", minLength: 1, maxLength: 500 },
    supportingClaimIds: claimIdsSchema,
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