# VS-72 — Auth Callback Session Loop Repair Plan

## Problem
Production iOS Safari reproduced a redirect loop after Auth0/Google callback: `/auth/login` → `/auth/callback` → `/` → login again. Vercel recorded repeated 307s while the Kairo API received no session request. The callback currently bridges the Auth0 API access token into a single browser cookie and enters the product shell immediately.

The exact access-token byte length was not captured and must not be added to logs. The repair therefore addresses the observable contract failure—no usable browser session after callback—without claiming that token size alone was the proven cause.

## Scope authority
- FR-01 Account and Workspace.
- DEC-001 provider-neutral managed OIDC/OAuth boundary.
- VS-16 Auth0 migration and VS-25 Auth0 readiness controls remain authoritative.
- User approved bounded scope + implementation with `Go` on 2026-08-20T19:11:00+02:00.
- Certification, merge, release, production enablement and deployment remain separate gates.

## Implementation
1. **Bound the browser token transport.** Keep the existing single access-token cookie for small tokens. Split larger tokens into fixed-size HttpOnly cookie parts and reconstruct them server-side. Reject incomplete or over-budget chunk state.
2. **Make callback completion explicit.** After Authorization Code + PKCE succeeds, set the browser session cookies and redirect to `/auth/complete` instead of directly entering the requested product route.
3. **Verify before entering Kairo.** `/auth/complete` must read the browser-retained token and call the existing `/api/v1/session` endpoint. Only a confirmed session may continue to the safe same-origin `returnTo` path.
4. **Fail closed without a loop.** Missing cookies, rejected bearer tokens, missing API configuration or transport failure redirect to Kairo's sign-in recovery page and clear every access-token cookie variant rather than restarting `/auth/login` automatically.
5. **Preserve cleanup semantics.** Logout clears both legacy and chunked access-token cookie formats.
6. **Regression-test the contract.** Cover token chunking/reassembly, incomplete chunk rejection, bounded maximum size, legacy compatibility, callback-completion success, API rejection and transport/configuration failure.

## Security invariants
- Authorization Code + PKCE and signed transaction state stay unchanged.
- Auth0 client credentials, bearer tokens and provider payloads are never logged or placed in URLs.
- `returnTo` remains constrained by `safeReturnTo`.
- Workspace/Brand authorization and API JWT issuer/audience/JWKS validation do not change.
- Cookie parts remain HttpOnly, Secure on HTTPS, SameSite=Lax and path `/`.

## Verification
- Run repository deterministic web/unit tests including the new session regression tests.
- Run Product Intake, Security and CI on one exact branch head.
- CI must include governance/preflight and web build before certification is considered.
- Production verification, after later exact-SHA release approval and deployment, must include one real iOS Safari Google login and confirm exactly one callback completion followed by an authenticated API session request.

## Rollback
If the candidate regresses authentication, do not partially disable controls. Roll back the complete VS-72 web deployment to the previously known VS-71 production revision and retain the incident evidence. A different repair must receive a new exact-SHA certification before production.
