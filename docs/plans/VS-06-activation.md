# VS-06 Activation Plan

Status: Prepared for governed activation under AUTH-001

## Purpose
Move Kairo from certified/merged VS-05 to VS-06 Critic, Judge and Approval while preserving one-active-slice governance and the frozen V1 product, technical and design authority.

## Authorization
AUTH-001 grants scope and runtime implementation authorization for the already-defined FR-12/FR-13 scope. It does not authorize scope expansion, material policy deviation, exact-SHA certification, release, deployment or production enablement.

## Activation changes
1. Preserve VS-05 in `delivery/completed-slices.json` as certified and unreleased.
2. Remove VS-06 from `delivery/backlog.json`.
3. Activate VS-06 as `ready-for-implementation` / `runtime-enabled`.
4. Bind scope and implementation approvals to AUTH-001.
5. Keep certification pending and require high-risk security review.
6. Keep publishing, scheduling, release and production enablement unauthorized.

## Superpowers sequence
1. Create a bounded implementation plan.
2. Define deterministic Truth/Claims Gate contracts with failing tests.
3. Implement logically separated Critic and Judge contracts without hidden Drafter reasoning.
4. Add bounded revision orchestration and fail-closed terminal behavior.
5. Add immutable version-bound approval records and invalidation rules.
6. Build findings, review and explicit approval UI using the approved design baseline.
7. Verify Brand isolation, authorization, concurrency, auditability and PostgreSQL behavior.
8. Run code, specification, UI and high-risk security review before exact-SHA certification.

No merge of implementation, release or deployment is part of this activation package.
