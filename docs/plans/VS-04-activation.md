# VS-04 Activation Plan

Status: Prepared for governed activation under AUTH-001

## Purpose

Move Kairo from certified/unreleased VS-03 to VS-04 Ideas, Research and Angles while preserving one-active-slice governance and the frozen V1 product/technical/design authority.

## Authorization

AUTH-001, recorded at 2026-08-13T00:45:00+02:00, grants scope and runtime implementation authorization for the already-defined VS-03 through VS-10 slices, including necessary UI/UX work, Superpowers execution, deterministic tests/review, CI/security fixes and bounded refactoring.

AUTH-001 does not grant material architecture/policy decisions, exact-SHA certification, merge, release, deployment or production-enable authority, and does not expand the PRD/TRD/design baseline.

## VS-04 authority

- Requirements: FR-08 Research Dossier and FR-09 Angle Development.
- Product outcome: accepted Opportunity or user Idea becomes evidence-backed research plus multiple inspectable/editable Angles before content generation.
- PostgreSQL remains authoritative for Ideas, Research, Claims and Angles.
- Agent output remains non-authoritative until schema/policy/provenance validation.
- Hermes remains constrained behind AgentRuntimePort with DirectModelRuntime fallback.
- Research sources remain untrusted input.
- Final drafting, publishing, scheduling and Performance Learning remain out of scope.

## Activation changes

1. Preserve VS-03 in `delivery/completed-slices.json` as certified and unreleased.
2. Remove VS-04 from `delivery/backlog.json`.
3. Activate VS-04 in `delivery/current-slice.json` as `ready-for-implementation` / `runtime-enabled` with AUTH-001 scope and implementation approvals.
4. Record policy as not-required for activation because approved PRD/TRD already define evidence, Claims, provenance, runtime and human-control policy; any newly discovered material decision still stops for human approval.
5. Keep certification pending and release/production enablement unauthorized.
6. Reset `.engineering/STATE.json` for VS-04 planning.

## Superpowers sequence after activation merge

1. Create focused VS-04 implementation plan.
2. Define Idea/Research/Claim/Angle contracts and lifecycle through TDD.
3. Add PostgreSQL schema/persistence with Workspace/Brand isolation and lineage tests.
4. Implement Researcher orchestration using the existing bounded AgentRuntimePort/ModelGateway/ToolGateway.
5. Implement prompt-injection and fabricated-evidence rejection tests.
6. Implement Strategist Angle generation and edit/select workflow.
7. Extend Kairo UI with Ideas, Research Dossier and Angle comparison surfaces using the approved design baseline and installed project UI skills.
8. Run specification/code review, accessibility/responsive checks, preflight, security and certification preparation.

No release or deployment is part of this activation package.
