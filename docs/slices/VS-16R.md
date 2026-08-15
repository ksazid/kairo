# VS-16R — Auth0 Production-Readiness Correction

Status: Approved and active — bounded corrective runtime implementation

## Goal
Fix the remaining production-readiness defects in the existing Auth0/OIDC sign-in path before Kairo resumes feature delivery.

## Requirement
- FR-01 Account and Workspace.

## Decision authority
- DEC-001 — managed standards-based OIDC/OAuth provider behind a Kairo-owned provider-neutral identity/session adapter.

## Confirmed facts
- Current Kairo account resolution is keyed by identity provider + subject; Auth0 access tokens do not need an email claim for session establishment.
- VS-16 and its manual-first UI correction passed deterministic certification.
- The approved VS-16 UI correction was not successfully deployed to production because Vercel rejected the deployment at the Free-plan daily build limit.
- Current `oidcConfiguration()` memoizes the discovery Promise. If discovery rejects once, the rejected Promise remains cached for the lifetime of that warm process and every later login request fails until the process is recycled.

## In scope
- Make OIDC discovery memoization retry-safe after a failed discovery attempt.
- Add deterministic tests proving success is cached, concurrent callers share one request, and a rejected discovery is evicted so a later attempt can recover.
- Fail the `/auth/login` entry point safely when provider/config discovery is unavailable, without exposing secrets or weakening PKCE/state checks.
- Preserve Auth0 Authorization Code + PKCE, signed one-time transaction cookie, same-origin return paths and existing Kairo API bearer-token bridge.
- Record VS-21 closeout and the external production-smoke blocker accurately.

## Out of scope
- Changing Auth0 tenant/application/provider.
- Changing Workspace/Brand authorization truth.
- Password collection by Kairo.
- Database or user migration.
- Refresh-token/session redesign.
- New identity providers, MFA, Organizations or RBAC.
- Infrastructure/release workflow changes.
- Deployment or production enablement for a new SHA without later explicit approval.

## Acceptance criteria
1. One successful OIDC discovery is reused within a warm process.
2. Concurrent discovery callers share one in-flight request.
3. A failed discovery is not cached permanently; the next call can recover.
4. `/auth/login` returns a safe Kairo sign-in failure state when OIDC discovery/configuration is unavailable instead of an unhandled server error.
5. No Client Secret, tokens, provider response body or credentials are exposed to the browser or logs added by this slice.
6. Existing PKCE/state, transaction-cookie, return-path and API verifier tests stay green.
7. Real production Auth0 email/Google/callback/API/logout smoke remains required after an exact hotfix SHA is deployed.

## Governance
- Risk: high — identity boundary.
- Scope and implementation approved by Sazid Khan via the instruction to fix auth before proceeding on 2026-08-15.
- Exact-SHA certification/merge remains mandatory.
- Release/deployment/production-enable remain separate approvals.
