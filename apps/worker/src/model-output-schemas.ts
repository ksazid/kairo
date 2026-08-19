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
const slideClaimIdsSchema = Object.freeze({
  type: "array",
  minItems: 1,
  description: "Use only Claim IDs supplied in the benchmark case. This list must be a subset of the top-level supportingClaimIds.",
  items: claimIdSchema,
});
const planClaimIdsSchema = Object.freeze({
  type: "array",
  minItems: 1,
  description: "Include every required Claim ID supplied in the benchmark case and every Claim ID referenced by any slide.",
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
          supportingClaimIds: slideClaimIdsSchema,
        },
        required: ["headline", "body", "supportingClaimIds"],
        additionalProperties: false,
      },
    },
    caption: { type: "string", minLength: 1, maxLength: 5_000 },
    cta: { type: "string", minLength: 1, maxLength: 500 },
    supportingClaimIds: planClaimIdsSchema,
  },
  required: ["format", "coverHook", "slides", "caption", "cta", "supportingClaimIds"],
  additionalProperties: false,
});

const qualityScoresSchema = Object.freeze({
  type: "object",
  properties: {
    brandFit: { type: "number", minimum: 0, maximum: 100 },
    hookQuality: { type: "number", minimum: 0, maximum: 100 },
    originality: { type: "number", minimum: 0, maximum: 100 },
    formatQuality: { type: "number", minimum: 0, maximum: 100 },
    criticScore: { type: "number", minimum: 0, maximum: 100 },
  },
  required: ["brandFit", "hookQuality", "originality", "formatQuality", "criticScore"],
  additionalProperties: false,
});

const candidateQualityEvaluationSchema = Object.freeze({
  type: "object",
  properties: {
    truthPassed: { type: "boolean" },
    scores: qualityScoresSchema,
    reasons: {
      type: "array",
      minItems: 1,
      maxItems: 6,
      items: { type: "string", minLength: 1, maxLength: 500 },
    },
  },
  required: ["truthPassed", "scores", "reasons"],
  additionalProperties: false,
});

const MARKETING_PAIR_QUALITY_EVALUATION_SCHEMA = Object.freeze({
  type: "object",
  properties: {
    candidateA: candidateQualityEvaluationSchema,
    candidateB: candidateQualityEvaluationSchema,
  },
  required: ["candidateA", "candidateB"],
  additionalProperties: false,
});

const GROQ_STRICT_MODELS = new Set(["openai/gpt-oss-20b", "openai/gpt-oss-120b"]);

export function responseFormatForOutputSchema(
  provider: string,
  model: string,
  outputSchema: OutputSchemaRef,
): OpenAICompatibleResponseFormat {
  if (provider === "groq" && GROQ_STRICT_MODELS.has(model)) {
    if (outputSchema.name === "marketing-carousel-plan" && outputSchema.version === "1") {
      return {
        type: "json_schema",
        json_schema: {
          name: "marketing_carousel_plan_1",
          strict: true,
          schema: CAROUSEL_PLAN_SCHEMA,
        },
      };
    }
    if (outputSchema.name === "marketing-pair-quality-evaluation" && outputSchema.version === "1") {
      return {
        type: "json_schema",
        json_schema: {
          name: "marketing_pair_quality_evaluation_1",
          strict: true,
          schema: MARKETING_PAIR_QUALITY_EVALUATION_SCHEMA,
        },
      };
    }
  }
  return { type: "json_object" };
}
