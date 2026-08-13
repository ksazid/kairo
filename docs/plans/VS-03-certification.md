# VS-03 Certification — Hunter and Discover

## Candidate criteria

A VS-03 candidate is certifiable only when all of the following are true on the exact candidate SHA:

1. FR-06/FR-07 implementation is complete and no out-of-scope VS-04+ behavior is introduced.
2. DEC-003 and DEC-005 are approved and reflected in runtime boundaries.
3. Product Intake passes.
4. Security baseline passes.
5. Full CI passes, including preflight, runtime verification, PostgreSQL tests, web/dashboard build and the fail-closed semantic benchmark.
6. Tenant isolation has no known bypass in Signal/Opportunity or semantic retrieval paths.
7. Hermes/Agent Reach cannot bypass Kairo ToolGateway, secrets, database authority or publishing controls.
8. Today/Discover have reviewed loading, error, empty and responsive states.
9. Release and production-enable approvals remain pending.

## Certification evidence

Evidence set:

- `docs/plans/VS-03-implementation.md`
- `docs/plans/VS-03-review.md`
- `evaluation/HERMES-VS-03.md`
- `evaluation/AGENT-REACH-VS-03.md`
- `evaluation/SEMANTIC-RETRIEVAL-VS-03.md`
- exact-candidate GitHub Actions Product Intake run
- exact-candidate GitHub Actions Security baseline run
- exact-candidate GitHub Actions CI run

## Human gate

Certification must be explicitly approved by the Product Owner against one exact tested candidate SHA. Prior scope, implementation, policy or merge authorization does not substitute for this exact-SHA certification approval.

## Release boundary

Certification does not authorize deployment, release or production enablement.
