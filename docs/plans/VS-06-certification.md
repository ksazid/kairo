# VS-06 Certification

Status: Ready for human certification after exact-head CI

The certification candidate is the final head of PR #15 after all required workflow checks pass. Certification must explicitly name that exact 40-character SHA; earlier scope, implementation or merge authorization does not substitute for this gate.

Required evidence:

- FR-12/FR-13 specification traceability and review record;
- full typecheck, test and production build;
- PostgreSQL integration tests in CI;
- Product Intake and Security baseline workflows;
- mandatory high-risk security review in `docs/plans/VS-06-review.md`;
- clean branch with no protected release or infrastructure changes.

After exact-SHA certification, record the approver, timestamp and SHA in `delivery/current-slice.json`, then merge PR #15 under the Product Owner's standing merge authorization. Release, deployment and production enablement remain separate, unauthorized gates.
