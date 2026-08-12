# Risks

## R1 — Cross-Brand data leakage
Severity: critical. Mitigation: mandatory Workspace/Brand scope in relational and semantic paths, tenant-isolation tests and no unscoped private-vector API.

## R2 — Unsupported or fabricated claims
Severity: high. Mitigation: structured claim provenance, deterministic Truth/Claims Gate, bounded Critic/Judge workflow and human approval.

## R3 — External agent/runtime lock-in
Severity: high. Mitigation: application-owned AgentRuntime/ControlPlane ports and DirectModel/native fallbacks.

## R4 — Malicious or over-privileged Skills
Severity: high. Mitigation: pinning, declared permissions, sandboxing, no automatic upstream updates and benchmark/security promotion gates.

## R5 — Social API/platform constraints
Severity: high. Mitigation: feasibility validation before VS-07 implementation and explicit manual fallback where the PRD permits it.

## R6 — AI operating cost
Severity: medium. Mitigation: per-workflow budgets, shared public research where safe, model gateway metering and pilot cost measurement.

## R7 — Premature product expansion
Severity: high. Mitigation: preserve `FR-01..FR-20` and explicit V1 exclusions until pilot evidence supports reopening scope.
