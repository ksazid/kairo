# VS-22 — Testing and Scope Review

## Candidate reviewed
Runtime/testing head: `49b8236654b4d13379c5bce1b88a112f8752eea2`.

## Gate evidence
- Product Intake #422: PASS.
- Security baseline #497: PASS.
- CI #556: PASS, including governance/preflight, workspace typecheck/tests/builds and clean PostgreSQL migration verification.

## Changed-file scope review
All PR #56 paths are within the approved VS-22 boundary: worker adapters/orchestration/tests/exports plus governed delivery/specification metadata. No migration, infrastructure, release workflow, production configuration or publishing authority changed.

## Acceptance review
- OpenAlex and Crossref implement the existing `DiscoverySourceProvider` contract.
- Both reject non-`global-public` requests before network I/O.
- Query result counts, timeouts and response sizes are bounded.
- OpenAlex prefers DOI identity and safely reconstructs bounded abstracts.
- Crossref normalizes DOI/publication metadata and strips markup from abstracts.
- Provider credentials/contact configuration remain adapter-owned and are not included in returned evidence/errors.
- Researcher scholarly enrichment requires an explicit `publicResearchQuery`; Brand-private `idea` content is not used in scholarly tool requests.
- One scholarly provider can degrade without fabricating success or preventing normal research where other evidence remains.
- General/OpenAlex/Crossref evidence is balanced and deduplicated by canonical DOI/URL before model invocation.
- Existing Research Dossier schema is preserved: provider/version is runtime evidence provenance while stable source URL/title/publication/retrieval provenance persists without a migration.
- Existing Claim evidence-ID and first-person authorization domain guards remain unchanged and green.

## Review notes
The first implementation gate attempt is preserved as failed CI #553: governance metadata used invalid lifecycle `implementation` and duplicated active VS-22 in backlog. The runtime test stage did not run. That metadata defect was corrected to the repository's `implementing` lifecycle and active-slice registry shape; the corrected runtime head then passed all three gates.

VS-23 and VS-24 are intentionally untouched. VS-23 still lacks a governed `advance-to-live` challenger result, and VS-24 remains dependent on VS-23 plus sufficient approved live evidence.

## Certification boundary
No release, deployment or production enablement is part of VS-22 certification. Human certification and merge must bind a future exact immutable SHA after this testing transition is recorded and its exact-head gates pass.
