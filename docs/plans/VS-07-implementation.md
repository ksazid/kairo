# VS-07 Implementation Plan

Status: In progress

Scope: FR-05, FR-14 and FR-15 under AUTH-001 and DEC-004. Release, deployment and production enablement remain excluded.

## 1. Domain contracts and invariants

- Add Channel Account capability state without exposing credential material.
- Add Calendar Entry, Publish Command, Publish Attempt and Published Post models.
- Require a current immutable approved Content Version and exact approval destination before scheduling or dispatch.
- Model `scheduled`, `dispatching`, `published`, `failed`, `unknown`, `manual-required` and `cancelled` truthfully.
- Add idempotency, bounded retry and reconciliation invariants with failing tests first.

## 2. Scoped persistence and application services

- Add Workspace/Brand-scoped PostgreSQL tables and composite foreign keys to approval/version lineage.
- Store only encrypted-secret references and non-sensitive connection metadata.
- Implement optimistic concurrency, idempotent commands, append-oriented attempts and audit events.
- Prove account/Brand isolation and stale approval rejection in memory and PostgreSQL tests.

## 3. Deterministic channel adapters

- Define provider-neutral Instagram, LinkedIn and manual publishing ports.
- Validate channel capabilities before accepting automated dispatch.
- Implement rate-limit safe retry classification and explicit unknown-state reconciliation.
- Keep OAuth tokens inside deterministic infrastructure adapters; no agent contract receives credentials or publishing capability.

## 4. API and worker execution

- Add channel connection status, calendar query, schedule/cancel, dispatch, retry and reconcile endpoints.
- Add due-command worker execution with leases and idempotency keys.
- Fail closed when approval, destination, capability, role or platform access is absent.
- Preserve external post IDs, provider correlation IDs and operator-visible failure detail without leaking secrets.

## 5. Calendar and publishing UI

- Add a simple cross-Brand calendar with Brand, Campaign, channel and status filters.
- Add calm connection/capability states and explicit reconnect/manual guidance.
- Schedule only approved current versions; show approval destination before confirmation.
- Show published, failed, unknown and manual-required states with bounded retry/reconcile actions.
- Follow the approved Kairo design baseline and responsive/accessibility patterns.

## 6. Verification and certification

- Run domain, API, worker, PostgreSQL, build, accessibility and responsive checks.
- Run specification, code-quality, UI and mandatory high-risk security review.
- Run Product Intake, Security baseline and full CI at the final clean head.
- Present the exact tested SHA for Product Owner certification before merge.
