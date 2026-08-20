# VS-68 implementation plan — Run D qualification hardening

## Goal

Recover from immutable Run C failure by eliminating known qualification-contract mismatch classes, adding bounded failure provenance, and authorizing one fresh Run D execution without changing qualification thresholds, provider/model, benchmark fixtures, pacing, Truth policy, publishing authority, or Hermes state.

## Changes

1. For the four approved motorcycle qualification cases, derive the Groq strict carousel JSON Schema from the benchmark case embedded in the model request. The provider schema accepts only supplied Claim IDs and bounds the top-level lineage to the required Claim count; Kairo's existing deterministic validator remains authoritative for required-Claim completeness.
2. Preserve the existing generic carousel schema for non-qualification callers.
3. Add bounded, non-sensitive evidence failure provenance: case, lane, execution stage, and stable underlying error code. Raw provider/error messages are not persisted.
4. Keep deterministic pair checks separately classified for fingerprint, measured metadata, and runtime-route failures.
5. Rotate the exact one-shot startup authorization from immutable Run C to fresh `vs23-qualification-20260820-d`.
6. Add regression coverage for dynamic Claim restrictions, fail-closed malformed qualification context, generic-schema compatibility, and bounded failure provenance.

## Non-goals

- no retries inside evidence lanes;
- no benchmark fixture mutation;
- no evaluator-rubric or threshold change;
- no provider/model/key/pricing change;
- no Hermes activation;
- no human scores, edit-distance evidence, final advancement verdict, publishing, VS-23 or VS-24 activation.

## Release protocol

After Product Intake, Security and full CI pass on an exact implementation SHA, freeze certification governance, merge, deploy dormant, verify exact release live, stage exactly one Run D authorization, execute the four paired cases, then clear all execution/startup triggers regardless of terminal result.
