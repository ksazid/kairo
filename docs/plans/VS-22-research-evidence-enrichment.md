# VS-22 — Research Evidence Enrichment Implementation Plan

## Boundary
Implement authoritative public scholarly evidence enrichment without changing Kairo's domain ownership or leaking Brand-private context.

## Execution sequence
1. Activate VS-22 governance and record VS-25 merge closeout separately from its still-unclaimed interactive Auth0 production smoke.
2. Add RED tests for OpenAlex and Crossref provider normalization, privacy rejection, bounded requests and failure classification.
3. Implement `research-evidence-adapters.ts` using the existing `DiscoverySourceProvider` contract.
4. Add RED Researcher tests proving explicit public-only enrichment, per-provider degradation and DOI/URL deduplication.
5. Extend `ResearcherOrchestrator` to fan out optional scholarly enrichment requests only when `publicResearchQuery` is explicitly supplied.
6. Export the Researcher and research-evidence adapters from `@kairo/worker`.
7. Run exact-head CI, Security baseline and Product Intake; repair failures without weakening tests.
8. Freeze an immutable runtime head, perform scope review, then present the exact SHA for human certification/merge approval.

## Design rules
- No provider SDKs in domain code.
- No provider credential in tool requests, evidence, logs or model context.
- Scholarly providers receive only a dedicated `publicResearchQuery`, never `idea`, Brand Brain or other Brand-private projection.
- One provider failure is a degraded source, not a fabricated empty success and not a failure of unrelated evidence sources.
- No new migration or persistence schema is required; provider provenance fits existing Research Dossier evidence.
- Deduplication prefers canonical DOI identity, then canonicalized URL identity.
- Result count and payload size remain bounded; abstracts are truncated before model context.

## Test evidence required
- OpenAlex success + optional-key non-leak + private-scope rejection + rate-limit/upstream classification.
- Crossref success + polite mailto behavior + private-scope rejection + malformed-response handling.
- Researcher general + scholarly merge, canonical dedupe, degraded source reporting, and no scholarly call when a public-only query is absent.
- Existing Researcher unknown-evidence and unauthorized-first-person tests remain green.
- Full repository CI/security/intake on the exact candidate.
