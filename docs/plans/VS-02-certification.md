# VS-02 Certification Evidence

Status: Running — awaiting exact-head human certification approval
Slice: VS-02 — Brand Brain and Knowledge
PR: #6
Requirements: FR-03, FR-04
Decision: DEC-006

## Certification scope

Certification covers only the approved Brand Brain and private Knowledge boundary. It does not authorize Hunter/Discover, Hermes, Agent Reach, Qdrant/vector promotion, publishing, deployment, release or production-enable behaviour.

## Reviewed implementation baseline

Testing head `85b1d27e4214bf14fce52eca01800f3c21cecb38` passed:
- Product Intake run 31639211266 — success;
- Security baseline run 31639211264 — success;
- CI run 31639211268 — success, including repository preflight, strict TypeScript checks, domain/API tests, PostgreSQL 18 migration/integration tests and Next.js production build.

## FR-03 — Brand Brain

Evidence includes Workspace/Brand scoped Brand Brain records; explicit `inferred`, `confirmed` and `stale` state; user correction/confirmation as authoritative context; optimistic concurrency; protection against inference downgrading confirmed facts; and a responsive Brand Brain UI for Identity, Positioning, Audience, Voice, Content strategy, Goals and Boundaries with explicit loading/error/unset/success states.

## FR-04 — Knowledge and sources

Evidence includes Brand-private URL/website, note, pasted, research, product and quarantined document records; no private raw source text in DTOs; explicit active/disabled/removed/quarantined lifecycle; safe not-found behavior for foreign Brand/source identifiers; URL registration without a network fetcher; document metadata kept quarantined; and deliberate confirmation before destructive source removal.

## DEC-006 deletion evidence

On private source removal Kairo atomically:
1. deletes source-only relational derivations and support links;
2. redacts source title, URI, raw content, content type, size, hash and object locator;
3. retains a content-free audit tombstone;
4. preserves user-confirmed Brand Brain facts;
5. marks inferred facts stale when they lose all support;
6. records the removal audit event.

This behavior is covered by memory/API and real PostgreSQL regression tests.

## Architecture and security evidence

- PostgreSQL remains authoritative and Fastify stays at the transport boundary.
- Every new Brand-owned relational record carries Workspace/Brand scope.
- No S3 vendor, malware vendor, Hermes, Agent Reach, Qdrant or other provider becomes mandatory or authoritative in VS-02.
- URL sources are records only; no SSRF-capable fetch path exists in this slice.
- Unsafe local/private URL literals and embedded credentials are rejected.
- Document ingestion remains fail-closed/quarantined.
- Release workflow and infrastructure paths remain protected.

## UI/accessibility evidence

The approved Kairo calm, content-first design is preserved. Field state uses text plus semantic indicators; controls have persistent labels and visible focus inheritance; responsive layouts collapse to one primary flow; reduced motion remains supported; important interactive targets meet the 44px baseline; and destructive source removal is two-step with explicit DEC-006 impact.

## Known bounded items

Not certification blockers because they remain disabled or belong to later slices: actual object upload/content sniffing/malware scanner execution; vector indexing/deletion propagation; Qdrant/PgVector promotion under VS-03; Hermes and Agent Reach; PostgreSQL RLS defence-in-depth evaluation; release; deployment; production enablement.

## Pass condition

The exact certification-state commit containing this evidence must pass Product Intake, Security and CI again. Human certification approval must bind that exact 40-character candidate SHA before lifecycle may transition to `certified` or PR #6 may merge.
