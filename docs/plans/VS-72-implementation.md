# VS-72 Implementation Plan — Research Evidence Relevance Repair

## Approach

Use deterministic retrieval hygiene before model judgment. The Researcher should receive only evidence that has a meaningful lexical relationship to the Idea, while model output remains subject to the existing claim/evidence validators.

## Steps

1. Add regression tests in `apps/worker/src/researcher.test.ts` for the observed off-topic management/government evidence and for a valid motorcycle evidence set.
2. Add a focused-query builder that extracts distinctive Idea terms, normalises simple plurals, removes generic/stop words, and keeps a bounded set of outcome terms.
3. Add deterministic evidence relevance filtering using title + summary against title anchors and premise terms.
4. Require at least two relevant evidence items (bounded by requested max) before invoking the Researcher or persisting Research.
5. Tighten the Researcher instruction to reject off-topic synthesis and make direct Idea relevance explicit.
6. Use the focused query for the Researcher's primary bounded public-content-search request while preserving the existing optional source-specific OpenAlex/Crossref routing.
7. Run CI/security/preflight/runtime verification and inspect review threads.
8. Stop at certification gate; do not merge or deploy without a separate user approval.

## Design constraints

- No new dependency.
- No private Brand Brain data enters global-public scholarly search beyond the existing user-Idea research request boundary.
- No changes to database schema or publishing controls.
- Deterministic filtering must be explainable and testable; no embedding/model call is added merely to decide whether evidence is relevant.
- Failure with insufficient relevant evidence is preferable to persisting unrelated Claims.

## Verification targets

- the two irrelevant production-style sources are filtered;
- at least two relevant motorcycle/modification sources proceed;
- evidence IDs in the runtime context are assigned only after filtering;
- insufficient relevant evidence fails before the model call and before persistence;
- existing Researcher safety tests remain green;
- existing API Research-start and Strategist regressions remain green.