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

function carouselPlanSchema(
  claimSchemas: { slide: Record<string, unknown>; plan: Record<string, unknown> } = {
    slide: slideClaimIdsSchema,
    plan: planClaimIdsSchema,
  },
): Record<string, unknown> {
  return {
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
            supportingClaimIds: claimSchemas.slide,
          },
          required: ["headline", "body", "supportingClaimIds"],
          additionalProperties: false,
        },
      },
      caption: { type: "string", minLength: 1, maxLength: 5_000 },
      cta: { type: "string", minLength: 1, maxLength: 500 },
      supportingClaimIds: claimSchemas.plan,
    },
    required: ["format", "coverHook", "slides", "caption", "cta", "supportingClaimIds"],
    additionalProperties: false,
  };
}

const CAROUSEL_PLAN_SCHEMA = Object.freeze(carouselPlanSchema());

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
const QUALIFICATION_CASE_IDS = new Set([
  "motorcycle-carousel-01",
  "motorcycle-carousel-02",
  "motorcycle-carousel-03",
  "motorcycle-carousel-04",
]);

export function responseFormatForOutputSchema(
  provider: string,
  model: string,
  outputSchema: OutputSchemaRef,
  input?: string,
): OpenAICompatibleResponseFormat {
  if (provider === "groq" && GROQ_STRICT_MODELS.has(model)) {
    if (outputSchema.name === "marketing-carousel-plan" && outputSchema.version === "1") {
      const qualification = qualificationClaimSchemas(input);
      return {
        type: "json_schema",
        json_schema: {
          name: qualification ? "marketing_carousel_plan_qualification_1" : "marketing_carousel_plan_1",
          strict: true,
          schema: qualification ? carouselPlanSchema(qualification) : CAROUSEL_PLAN_SCHEMA,
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

function qualificationClaimSchemas(
  input: string | undefined,
): { slide: Record<string, unknown>; plan: Record<string, unknown> } | null {
  if (!input) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const context = (parsed as { context?: unknown }).context;
  if (!context || typeof context !== "object" || Array.isArray(context)) return null;
  const benchmarkCase = (context as { benchmarkCase?: unknown }).benchmarkCase;
  if (!benchmarkCase || typeof benchmarkCase !== "object" || Array.isArray(benchmarkCase)) return null;
  const candidate = benchmarkCase as {
    caseId?: unknown;
    format?: unknown;
    claims?: unknown;
    requiredClaimIds?: unknown;
  };
  if (typeof candidate.caseId !== "string" || !QUALIFICATION_CASE_IDS.has(candidate.caseId)) return null;
  if (candidate.format !== "carousel") throw new Error("Qualification carousel structured-output context has an invalid format");
  if (!Array.isArray(candidate.claims) || !candidate.claims.length) {
    throw new Error("Qualification carousel structured-output context requires Claims");
  }
  const claimIds = candidate.claims.map((claim) => {
    if (!claim || typeof claim !== "object" || Array.isArray(claim)) {
      throw new Error("Qualification carousel structured-output context has an invalid Claim");
    }
    const id = (claim as { id?: unknown }).id;
    if (typeof id !== "string" || !id.trim() || id.trim().length > 200) {
      throw new Error("Qualification carousel structured-output context has an invalid Claim ID");
    }
    return id.trim();
  });
  if (new Set(claimIds).size !== claimIds.length) {
    throw new Error("Qualification carousel structured-output Claim IDs must be unique");
  }
  if (!Array.isArray(candidate.requiredClaimIds) || candidate.requiredClaimIds.length !== claimIds.length) {
    throw new Error("Qualification carousel structured-output requires every supplied Claim");
  }
  const required = candidate.requiredClaimIds.map((value) => {
    if (typeof value !== "string" || !value.trim()) {
      throw new Error("Qualification carousel structured-output has an invalid required Claim ID");
    }
    return value.trim();
  });
  if (new Set(required).size !== required.length || required.some((id) => !claimIds.includes(id))) {
    throw new Error("Qualification carousel structured-output required Claims must equal the supplied Claim lineage");
  }
  const item = { type: "string", enum: claimIds };
  return {
    slide: {
      type: "array",
      minItems: 1,
      maxItems: claimIds.length,
      description: `Use only the supplied benchmark Claim IDs: ${claimIds.join(", ")}.`,
      items: item,
    },
    plan: {
      type: "array",
      minItems: required.length,
      maxItems: required.length,
      description: `Include every and only required Claim ID exactly once: ${required.join(", ")}.`,
      items: item,
    },
  };
}
