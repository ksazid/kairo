# VS-08 Activation Plan

Status: Activated for runtime implementation

## Authority

AUTH-001 and the Product Owner's explicit all-slices approval authorize the frozen FR-16 scope and runtime implementation. VS-07 provides the required Published Post identity and content lineage. Exact-SHA certification, release, deployment and production enablement remain separate gates.

## Implementation sequence

1. Define raw metric snapshot, normalized metric, provenance, freshness and collection-attempt contracts with failing tests.
2. Bind every metric record to the tenant, Brand, Published Post, channel account and immutable content lineage.
3. Implement capability-aware Instagram and LinkedIn metric collectors that label unsupported or inaccessible metrics unavailable rather than inventing values.
4. Persist append-only raw snapshots and reproducible normalization/transformation metadata in PostgreSQL.
5. Add idempotent asynchronous collection, bounded retries, rate-limit handling and auditable failure state.
6. Calculate Brand baselines only from eligible evidence and expose sample size, time window and freshness.
7. Build Performance views for Published Posts with provenance, stale and unavailable states using Kairo's approved design baseline.
8. Verify tenant isolation, concurrency, source integrity, PostgreSQL behavior, accessibility and responsive states.
9. Run specification, code, UI and risk-based security review before exact-SHA certification.
