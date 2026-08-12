# VS-03 Activation and Standing Authorization Plan

Status: Prepared for governed activation

## Purpose

Move Kairo from certified/unreleased VS-02 to VS-03 Hunter and Discover while preserving one-active-slice governance and recording the user's standing authorization for VS-03 through VS-10.

## Human authorization captured

At 2026-08-13T00:45:00+02:00, Sazid Khan approved continuing the remaining V1 slices under the previously stated conditions.

AUTH-001 grants only:

- scope approval for the already-defined/frozen slice scope;
- runtime implementation within that approved scope;
- necessary UI/UX work, Superpowers execution, deterministic testing/review, CI/security fixes and bounded refactoring needed to satisfy gates.

AUTH-001 does not grant:

- material architecture/policy decisions that require evidence;
- exact-SHA certification;
- certification-candidate merge authority;
- release, deployment or production-enable authority;
- product/PRD/TRD/design scope expansion.

## Activation changes

1. Preserve VS-02 in `delivery/completed-slices.json` as `certified` and `unreleased`.
2. Remove VS-03 from `delivery/backlog.json` to preserve unique slice IDs.
3. Activate VS-03 in `delivery/current-slice.json` at `ready-for-implementation` / `runtime-enabled` with typed scope and implementation approvals from AUTH-001.
4. Keep DEC-003 pending; it blocks certification only.
5. Preserve DEC-005 as the approved Agent Reach boundary.
6. Keep release and production-enable pending/not-authorized.
7. Reset `.engineering/STATE.json` to VS-03 planning/implementation preparation.

## Immediate Superpowers work after activation

- verify/install approved product UI skills referenced by `AGENTS.md` before substantial Discover/Today UI work;
- produce a bounded VS-03 implementation plan;
- define `AgentRuntimePort`, `ModelGateway`, `ToolGateway`, provider contracts and server-side secret boundaries;
- run Hermes runtime and Agent Reach provider spikes;
- implement Signal/Opportunity/novelty domain behaviour with TDD;
- implement PostgreSQL persistence and tenant/Brand isolation tests;
- implement Today/Discover UI against `product/DESIGN.md`;
- build versioned Hunter/relevance evaluation evidence;
- benchmark Qdrant/TurboQuant vs PgVector and request the separate DEC-003 human decision before certification.

No release or deployment is part of this activation package.
