# VS-05 Activation Plan

Status: Prepared for governed activation under AUTH-001

## Purpose

Move Kairo from certified/merged VS-04 to VS-05 Campaign and Content Studio while preserving one-active-slice governance and the frozen V1 product, technical and design authority.

## Authorization

AUTH-001 grants scope and runtime implementation authorization for the already-defined VS-03 through VS-10 slices, including UI/UX work, Superpowers execution, deterministic tests/review, CI/security fixes and bounded refactoring.

AUTH-001 does not grant scope expansion, material architecture/policy decisions, exact-SHA certification, merge, release, deployment or production enablement.

## VS-05 authority

- Requirements: FR-10 Campaign and FR-11 Content Studio.
- Product outcome: a selected Idea/Angle becomes a Campaign with channel-specific Content Assets and immutable, comparable Content Versions.
- PostgreSQL remains authoritative for Campaigns, assets, versions and lineage.
- Generation remains provider-neutral, budgeted and non-authoritative until validation.
- External executable Skills remain disabled unless their separate sandbox/provenance gate passes.
- Critic/Judge acceptance, approval, publishing, scheduling and Performance Learning remain out of scope.

## Activation changes

1. Preserve VS-04 in `delivery/completed-slices.json` as certified and unreleased.
2. Remove VS-05 from `delivery/backlog.json`.
3. Activate VS-05 as `ready-for-implementation` / `runtime-enabled` with AUTH-001 scope and implementation approvals.
4. Record policy as not-required because approved PRD/TRD already govern lineage, immutable versions, runtime/provenance and Brand isolation; external executable Skills stay disabled absent a separate gate.
5. Keep certification pending and release/production enablement unauthorized.
6. Reset `.engineering/STATE.json` for Superpowers implementation planning after activation merge.

## Superpowers sequence after activation merge

1. Create the bounded VS-05 implementation plan.
2. Define Campaign, channel execution, Content Asset and immutable Content Version contracts with TDD.
3. Add PostgreSQL persistence and Brand-isolation/lineage/concurrency tests.
4. Implement bounded Campaign/Content APIs and idempotent generation commands.
5. Implement provider-neutral contextual generation with schema and provenance validation; do not enable arbitrary external Skills.
6. Build the calm Content Studio, evidence access, version comparison and responsive/accessible states using the approved design baseline.
7. Run specification/code/UI/security review, deterministic checks, CI and certification preparation.

No release or deployment is part of this activation package.
