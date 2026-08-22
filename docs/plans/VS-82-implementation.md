# VS-82 implementation plan

## Workstream A — source intelligence and health
1. Extend bounded Instagram snapshot contracts and Meta reads with safe engagement/media fields.
2. Add deterministic pattern extraction plus a replaceable visual-analysis port and persist evidence/provenance.
3. Extend connection-health reads and Brand Brain presentation for permissions, synchronization, expiry and failures.

## Workstream B — Brand rendering and assets
4. Resolve only approved Brand-owned media/font/logo assets through the existing private object boundary.
5. Composite supported assets through the renderer, preserve layout/quality evidence and create immutable thumbnails.

## Workstream C — performance learning
6. Join published lineage to content dimensions and derive cautious dimension-specific Candidate Learnings.
7. Add accepted Learning projection to Brand Brain Performance Memory and recommendation context.

## Workstream D — production verification and documentation
8. Extend the authenticated smoke harness for end-to-end multi-Brand scope, concurrent Research, Calendar and Results assertions. The harness is read-only at the external-provider boundary and requires explicit deployed-environment variables.
9. Preserve evidence, then close/remove temporary smoke resources. PR #128 evidence is preserved; PR #141 and issue #142 are closed after successful Reel/concurrency production evidence.
10. Reconcile PRD, TRD, decision log, roadmap, status, README and slice evidence.

## Verification
- TDD for contracts, adapters, analysis, lineage, tenant scope, idempotency and renderer asset safety.
- UI assertions for readable states, responsive collapse, focus and non-colour meaning.
- PostgreSQL migration/integration verification where schema changes are required.
- Full typecheck, tests, build, preflight, security baseline and draft PR.
- Stop for exact-SHA merge approval; do not release or deploy.

## Completion evidence
- Runtime `ec01d4b08bc58e92a615f90a8e18c221f2c45610` is live on Render.
- Publishing worker startup and a provider-backed Reel publish completed successfully.
- Calendar shows the verified Reel as Published; Results exposes fresh Instagram observations.
- PR #141 and issue #142 are closed.
