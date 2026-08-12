# VS-02 Certification Evidence

Status: Attempt 1 failed — returned to testing
Slice: VS-02 — Brand Brain and Knowledge
PR: #6
Requirements: FR-03, FR-04
Decision: DEC-006

## Certification scope

Certification covers only the approved Brand Brain and private Knowledge boundary. It does not authorize Hunter/Discover, Hermes, Agent Reach, Qdrant/vector promotion, publishing, deployment, release or production-enable behaviour.

## Reviewed implementation baseline

Testing head `85b1d27e4214bf14fce52eca01800f3c21cecb38` passed Product Intake run 31639211266, Security baseline run 31639211264 and CI run 31639211268.

## Attempt 1

Candidate `e8be7112d5471cb9f1a277309246a5e29249ef9c` passed Product Intake run 31639448975 and Security baseline run 31639448876, but CI run 31639448872 failed during PostgreSQL integration tests.

The failure exposed a test-isolation defect: the VS-01 and VS-02 integration-test files shared one PostgreSQL database while Vitest executed files in parallel. Both files used `TRUNCATE` setup against overlapping tables, which allowed one file to erase or lock data while the other file was still executing. Symptoms included an identity-reuse mismatch, a `Brand not found` in the DEC-006 test, and a PostgreSQL deadlock during concurrent truncation.

This candidate is therefore not certifiable. The slice returned to `testing`; the failed candidate and run are preserved as evidence.

## Corrective action

The API test command is changed to `vitest run --no-file-parallelism`, serializing test files that share the external PostgreSQL test database. Tests within each file remain sequential by default. No product/domain policy is weakened and no failing assertion is removed.

A new certification candidate may be created only after the corrected testing head passes Product Intake, Security and the full CI/runtime/PostgreSQL/Next build again.

## FR-03 / FR-04 and DEC-006 evidence

The functional, architecture, security and UI evidence remains as documented in `docs/plans/VS-02-review.md`. The failed attempt does not change the approved scope or implementation semantics; it changes the deterministic test harness so shared-database integration suites cannot corrupt each other's setup state.

Release, deployment and production-enable remain unapproved.
