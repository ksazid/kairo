# VS-02 Implementation Plan — Brand Brain and Knowledge

Status: Authorized for runtime implementation outside production
Requirements: FR-03, FR-04
Decision: DEC-006 approved
Method: PES/Loop → Superpowers → TDD → deterministic gates → review → certification

## Guardrails

- Extend the VS-01 Account/Workspace/Brand authorization boundary; never authorize by Brand/source ID alone.
- PostgreSQL remains authoritative. No Qdrant/PgVector promotion in VS-02.
- No Hermes, Agent Reach, Hunter, Campaign generation, publishing, metrics, arbitrary executable Skills or production deployment.
- Private Brand material never enters Global Intelligence by default.
- Source deletion follows DEC-006 exactly.
- No URL fetcher is introduced in VS-02; URL sources are governed records only, avoiding an SSRF-capable network path until a separately tested ingestion worker exists.
- Document source metadata may be registered only in quarantine. It cannot become active unless deterministic type/size validation and a clean malware-scan result are supplied through approved ports. No storage vendor is selected.

## Task 1 — Contracts and domain invariants (TDD)

1. Add failing tests for Brand Brain field states: `inferred`, `confirmed`, `stale`.
2. Add failing tests that user correction/confirmation becomes authoritative `confirmed` state.
3. Add failing tests for Knowledge source types/lifecycle and URL/document safety validation.
4. Add failing tests for DEC-006: removal redacts raw private content, removes source-only derivations/support links, preserves confirmed fields and stales unsupported inferred fields.
5. Add typed contracts for Brand Brain reads/updates and Knowledge source create/list/lifecycle commands.
6. Implement the smallest domain/service changes to satisfy the tests.

## Task 2 — PostgreSQL persistence and migration (TDD)

1. Add `0002_brand_brain_knowledge.sql` with Workspace/Brand scoped tables and indexes.
2. Persist Brand Brain fields with state/version/provenance metadata.
3. Persist private Knowledge source records with active/disabled/quarantined/removed lifecycle and nullable content-bearing fields so deletion can leave a content-free tombstone.
4. Persist source→Brand Brain support links and relational derived-record metadata.
5. Implement deletion transaction: redact source content/URI/object metadata, delete source-only derived data/support links, stale orphaned inferred fields, preserve confirmed fields, append audit event.
6. Add real PostgreSQL integration tests for tenant isolation, lifecycle transitions, deletion propagation and cross-Brand denial.

## Task 3 — Fastify API boundary (TDD)

1. Add authenticated, tenant-safe routes:
   - `GET /api/v1/brands/:brandId/brain`
   - `PUT /api/v1/brands/:brandId/brain/:fieldKey`
   - `GET /api/v1/brands/:brandId/sources`
   - `POST /api/v1/brands/:brandId/sources`
   - `POST /api/v1/brands/:brandId/sources/:sourceId/disable`
   - `POST /api/v1/brands/:brandId/sources/:sourceId/enable`
   - `DELETE /api/v1/brands/:brandId/sources/:sourceId`
2. Return customer-safe validation/problem details.
3. Ensure foreign Brand/source IDs produce safe not-found behaviour, not existence disclosure.
4. Keep Fastify types out of domain/application code.

## Task 4 — Brand Brain web workspace

1. Extend the approved Kairo shell with a Brand Brain route/workspace rather than a dashboard redesign.
2. Present Identity, Positioning, Audience, Voice, Content strategy/goals, Boundaries and Knowledge.
3. Make `Confirmed`, `Inferred`, and `Needs review` visually and textually distinct without colour-only meaning.
4. Support user correction/confirmation and Knowledge source add/disable/enable/remove flows.
5. Cover loading, empty, validation-error, API-error, disabled/removed source and successful-save states.
6. Preserve approved design tokens, calm content-first hierarchy, keyboard focus, mobile collapse and reduced-motion behaviour.

## Task 5 — Security/adversarial verification

- cross-Workspace/Brand API and PostgreSQL tests;
- source-id guessing/non-disclosure tests;
- no private source content in logs or Global Intelligence structures;
- unsafe URL literal rejection (`localhost`, loopback, link-local/private IP literals, non-HTTP(S));
- document type/size/quarantine/scan-contract tests;
- prompt-like source text is persisted as untrusted content and cannot alter application permissions/policy;
- DEC-006 deletion propagation regression tests.

## Task 6 — Review and certification preparation

1. Run repository preflight, strict TypeScript checks, API/domain tests, PostgreSQL integration tests and Next.js build through CI.
2. Run specification-compliance, architecture, security and UI/accessibility review against the approved baseline.
3. Fix findings through the same Superpowers loop; do not weaken tests to make gates green.
4. Move lifecycle `implementing → testing → certification` only with evidence.
5. Bind certification to the exact final 40-character SHA and stop for human certification/merge approval.

Release, deployment and production-enable remain outside this plan.
