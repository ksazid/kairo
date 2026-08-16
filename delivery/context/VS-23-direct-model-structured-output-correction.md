# VS-23 prerequisite — DirectModel structured-output correction

Date: 2026-08-17

## Trigger

The owner authorized exactly one Corey-vs-Kairo qualification attempt on release `a9f3a1f918b22a244ee906638f17d398ef01ae59` with run ID `vs23-corey-kairo-20260817-a9f3a1f-01`.

That durable run failed closed in the first Kairo Native lane before Corey executed. The DirectModelRuntime provider call returned valid JSON that failed Kairo validation for `marketing-carousel-plan@1`. The benchmark flag was returned to `0`; the failed run ID is terminal and must not be reused.

## Root cause

The OpenAI-compatible model gateway requested only JSON object mode. JSON object mode constrains syntax but does not constrain the response to Kairo's carousel structure.

## Correction boundary

- For provider `groq`, models `openai/gpt-oss-20b` and `openai/gpt-oss-120b`, and output schema `marketing-carousel-plan@1`, request strict JSON Schema structured output.
- The strict schema closes all objects with `additionalProperties: false` and requires every carousel property.
- Existing Kairo runtime/domain validators remain authoritative after provider decoding.
- All unrelated schemas, providers and models retain the existing JSON object mode.

## Preserved invariants

- no provider, model, API key or pricing mutation;
- no Hermes activation;
- no tool enablement;
- no customer or Brand data added to benchmark inputs;
- no publishing capability;
- no database migration;
- no benchmark execution in this correction PR;
- the existing four motorcycle fixtures, prompts, scoring, budgets, Corey pin and 65-second pacing remain unchanged.

## Gates

This correction requires exact-head Product Intake, Security and CI certification. Merge, production deployment and any new benchmark attempt remain separate approvals. Any later benchmark must use a fresh run ID and an exact deployed release SHA.
