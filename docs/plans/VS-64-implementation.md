# VS-64 Implementation Plan

## Goal

Refresh legacy PR #79 onto current Kairo so a Marketing Lab qualification deployment can settle safely without spending the separately approved benchmark attempt until an exact PostgreSQL authorization is inserted.

## Authority reconciled

- Current product authority remains `product/PRD.md` FR-12 and FR-20.
- Issue #58 remains the evidence gate; VS-64 does not close it.
- The active paired benchmark route is `DirectModelRuntime`, as established after the earlier Hermes incidents.
- Existing worker qualification semantics and fixtures are protected and unchanged.
- Current migrations extend through `0021_content_asset_selection.sql`; therefore the authorization migration is `0022`, not the stale legacy PR's `0017`.

## Implementation steps

1. Add `0022_marketing_shadow_evidence_authorizations.sql` with exact run/release binding and one-outstanding-authorization uniqueness.
2. Extend `PgMarketingShadowEvidenceRunStore` with durable status lookup and atomic authorization consumption.
3. Make `executeMarketingShadowEvidenceAttempt` return before claim/model work unless status is `authorized`.
4. Keep completion/failure persistence idempotent and sanitize persisted failure categories.
5. Replace startup-fire execution in `server.ts` with a five-second control poll that remains model-idle while `not-authorized` and terminates on started/completed/failed execution state.
6. Do not reintroduce Hermes readiness into the active benchmark path.
7. Add focused unit tests and PostgreSQL integration tests for no-authorization behavior, global one-shot authorization, release binding, concurrent consumption and idempotent settlement.
8. Run Product Intake, Security and full CI on the implementation head.
9. After implementation verification, transition only governance to certification and rerun all gates on one frozen exact candidate.
10. Stop for explicit exact-SHA certification + merge approval.

## Security / operations review points

- No authorization => no provider/model invocation.
- Authorization is deleted in the same transaction that creates the durable `started` record.
- Existing run state takes precedence over a mistakenly recreated authorization for the same run ID.
- Release SHA mismatch fails closed.
- No bearer token, provider key, prompt, model output or provider error body is persisted by the control path.
- Server logs use bounded failure categories for this control path.
- Database migration application and authorization insertion are production mutations and remain outside this slice.

## Verification

Required exact-head gates:

- Product Intake;
- Security baseline;
- CI including clean PostgreSQL 18 migrations, production dependency audit, governance/preflight, runtime typecheck/tests/builds and dashboard build.

No deployment or benchmark attempt is part of verification.
