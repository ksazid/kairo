# VS-23 prerequisite evidence runner — bounded execution context

## Purpose

Close the remaining Issue #58 evidence gap by executing the already-prepared four-case motorcycle carousel qualification through the live Hermes reasoning boundary. This is prerequisite evidence only; it does not activate VS-23 or qualify Corey by itself.

## Approved execution boundary

- Execute exactly `motorcycle-carousel-01` through `motorcycle-carousel-04` from `evaluation/marketing-lab/benchmark-cases.json`.
- Run the Kairo Native `kairo-native-carousel@1` baseline and the pinned `corey-social-shadow@2.2.0+7868cb9` challenger on the identical transformed input for each case.
- Use Hermes directly in primary-only evidence semantics; do not fall back to another runtime for qualification evidence.
- Retrieve only the exact pinned public Corey skill source and verify its Git blob hash before supplying it as untrusted reference context.
- Give the challenger zero tool calls, no social/network capability, no secrets, no Instagram credentials and no publishing authority.
- Require measured cost and latency metadata for both lanes; missing evidence fails closed.
- Emit only synthetic benchmark outputs, source provenance and safe runtime metadata to the application evidence log marker.
- The runner is default-off and starts only when `KAIRO_MARKETING_SHADOW_EVIDENCE_RUN=1` is explicitly configured for an approved evidence deployment.

## Explicit exclusions

- No private production Brand context.
- No Instagram account data or Insights in this controlled round.
- No autonomous publication.
- No skill promotion, Brand selection, VS-23 activation or deterministic winner claim.
- No fabricated quality, preference or edit-distance evidence.

## Completion sequence

1. Certify an exact runner SHA through CI, Security and Product Intake.
2. Obtain explicit exact-SHA deployment approval.
3. Enable the one-shot evidence flag for the approved deployment, collect the paired execution log, then disable the flag.
4. Present the four pairs blind as A/B for human scoring.
5. Add truth/quality, preference and edit-distance evidence and derive the deterministic verdict from the existing qualification thresholds.
