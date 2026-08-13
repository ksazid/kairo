# VS-07 Activation Plan

Status: Activated for runtime implementation

## Authority

AUTH-001 and the Product Owner's explicit all-slices approval authorize the frozen FR-05/FR-14/FR-15 scope and runtime implementation. DEC-004 approves official capability-gated Instagram and LinkedIn adapters with a mandatory manual fallback. Exact-SHA certification, release, deployment and production enablement remain separate gates.

## Implementation sequence

1. Define Channel Account, Calendar Entry, Publish Command and Published Post contracts with failing tests.
2. Enforce current immutable Content Version approval and destination matching before scheduling or dispatch.
3. Add encrypted adapter-only credential references and least-privilege OAuth connection state; never return tokens through APIs.
4. Implement deterministic Instagram and LinkedIn ports, idempotency keys, bounded retries, rate-limit handling and unknown-state reconciliation.
5. Implement first-class `manual-required` fallback and operator completion evidence.
6. Build the cross-Brand Calendar, channel connection, schedule, retry and reconciliation UI using Kairo's approved design baseline.
7. Verify tenant isolation, concurrency, auditability, credential non-disclosure, PostgreSQL behavior and inaccessible platform paths.
8. Run specification, code, UI and mandatory high-risk security review before exact-SHA certification.
