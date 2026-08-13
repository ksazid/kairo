# REL-001 — Kairo V1 Pilot Release Readiness

**Status:** In progress — preparation only  
**Release candidate:** `27c15b0dda1914c24fae71f87c7eb94c99886525`  
**Release:** `REL-001`  
**Included slices:** VS-01 through VS-10  
**Release / deployment / production-enable approval:** **Not granted**

## Purpose

Prepare the already-certified Kairo V1 codebase for a controlled pilot without expanding V1 product scope or changing the certified runtime candidate. The certified VS-10 head contains the complete VS-01…VS-10 codebase and is therefore the release-candidate snapshot.

If readiness work discovers a runtime defect that requires product-code changes, the release candidate must move to a new exact SHA and pass certification again before release can proceed.

## Required readiness work

1. **Governance traceability**
   - Reconcile `delivery/completed-slices.json` so VS-09 and VS-10 are archived with their exact certification and merge evidence.
   - Keep release and production-enable approvals pending until separately granted for an exact SHA.

2. **Deployment topology — DEC-008**
   - Compare supported pilot topologies using current official provider capability, pricing, quotas, commercial-use terms, regions, egress, backups, observability and runtime compatibility.
   - Confirm Next.js web hosting, a Node.js 24 Fastify/container API, PostgreSQL + PgVector, secrets, OAuth callbacks and any required scheduling/worker execution.
   - Do not set `deployment/PROFILE.json.approvedSelection=true` until the human provider/topology decision is recorded.

3. **Database readiness**
   - Apply migrations `0001` through `0013` from the certified SHA to a clean PostgreSQL pilot database or disposable equivalent.
   - Verify PgVector requirements, connection pooling, backup availability and migration ordering.
   - Record rollback/forward-recovery procedure before release approval.

4. **Configuration and secrets matrix**
   - Verify `DATABASE_URL`, OIDC issuer/audience/JWKS settings, `KAIRO_API_URL`, model-gateway configuration and approved channel credentials.
   - Keep credentials out of Git and agent-visible content.
   - Capability-gate Instagram and LinkedIn; unsupported paths must remain explicit manual fallbacks.

5. **Exact-SHA system smoke**
   - API live/readiness checks.
   - Authenticated Workspace/Brand access and cross-tenant denial.
   - Brand Brain/Knowledge → Discover → Idea/Research/Angle → Campaign/Content → Critic/Approval → Calendar/Publishing → Performance → Learning/Experiment.
   - Publishing must either succeed through an approved capability or fail closed to manual fallback.
   - Pilot Operations must show redacted failure telemetry and safe-retry behaviour.

6. **Operational readiness**
   - Confirm logging/health evidence does not expose Brand-private content or credentials.
   - Verify cost/budget controls, provider-failure visibility and safe disable/retry controls.
   - Define pilot rollback trigger, owner and recovery verification.

## Release-order contract

`database/migrations → API → API health check → web → end-to-end smoke`

All deployed components must identify the same certified release SHA.

## Human gates

- `DEC-008`: provider/topology decision — blocks release and production enablement.
- `release`: exact-SHA approval after readiness evidence and rollback readiness.
- `production-enable`: separate exact-SHA approval for any guarded production behaviour.

## Exit criteria

REL-001 may be proposed for release approval only when:

- governance validation and preflight pass;
- VS-09/VS-10 history is reconciled;
- DEC-008 is approved from current official evidence;
- deployment profile matches the approved topology;
- all migrations pass on the pilot target or equivalent clean environment;
- API health and end-to-end smoke pass against the exact certified SHA;
- medium/high-risk rollback readiness is documented and verified;
- no unresolved high-risk security finding remains.

This plan does **not** itself authorize provisioning, deployment, release, external publishing enablement or production traffic.
