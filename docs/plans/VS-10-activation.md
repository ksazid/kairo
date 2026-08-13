# VS-10 Activation Plan

Status: Activated for runtime implementation

## Authority

AUTH-001 authorizes the frozen FR-20 scope and runtime implementation after certified VS-09. VS-10 is high-risk because it introduces operator authorization, retry/disable controls, cost accounting and operational diagnostics. Policy approval remains separate where a material new policy decision is discovered. Exact-SHA certification, release, deployment and production enablement remain separate gates.

## Implementation sequence

1. Define Brand-scoped workflow failure, operational action, cost event, workflow budget and intervention-audit contracts with failing tests.
2. Enforce least-privilege operator authorization at the server boundary; unauthorised users fail closed without leaking operational or private Brand data.
3. Add redacted failure diagnostics across Brand setup, Hunter, research, generation, Critic, publishing and metric workflows without logging sensitive content by default.
4. Implement safe retry controls with idempotency, provenance and explicit retryability rules; non-retryable or unsafe operations fail closed.
5. Add explicit automation-disable state that halts affected automation without corrupting authoritative domain state and records who changed it and why.
6. Record model, search, tool and social execution costs per Brand and workflow with bounded budgets; budget exhaustion blocks additional automated spend rather than authorising overage.
7. Persist manual intervention and safety-policy audit records as append-oriented provenance.
8. Add operational health/failure telemetry and an internal pilot operations UI using the approved Kairo product design baseline.
9. Verify tenant isolation, least privilege, audit integrity, retry idempotency, budget enforcement, PostgreSQL behaviour, accessibility and responsive states.
10. Run specification, code, UI and mandatory high-risk security review before exact-SHA certification.
