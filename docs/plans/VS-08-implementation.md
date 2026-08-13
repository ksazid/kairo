# VS-08 Implementation Plan

Status: In progress

Scope: FR-16 Performance Tracking only

Method: PES/Loop → Superpowers → TDD → deterministic verification → specification/code/UI/security review → exact-SHA certification preparation.

## 1. Domain contracts

- Add raw snapshot, normalized metric, provenance, freshness and collection-attempt types.
- Reject cross-scope lineage, unsupported values, non-finite/negative counts and malformed timestamps.
- Represent unavailable metrics explicitly and never synthesize a numeric value.

## 2. Persistence and service

- Add append-only PostgreSQL metric snapshots and normalized observations with transformation metadata.
- Add Brand-scoped repository/service queries and evidence-bound baseline calculations.
- Preserve Published Post → Content Version → Asset → Campaign lineage.

## 3. Collection

- Add capability-aware Instagram and LinkedIn collector ports/adapters.
- Use idempotent collection keys, bounded attempts, retry scheduling and auditable terminal states.
- Treat missing permissions and unsupported fields as unavailable, not zero.

## 4. API and UI

- Add authenticated Brand-scoped Performance APIs.
- Add Performance navigation and a responsive page showing post metrics, provenance, freshness, baseline window/sample size, unavailable and failure states.

## 5. Verification

- Run domain, API, worker and PostgreSQL tests, workspace typechecks, production build, governance and preflight.
- Run specification/code/UI and risk-based security review.
- Prepare a clean exact-SHA certification candidate and stop for human certification.
