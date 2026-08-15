# VS-16 implementation plan — Auth0 identity provider migration

## Authority
FR-01, DEC-001, VS-16. No product-scope expansion.

## Implementation strategy
Use the already-pinned `openid-client` v6.8.4 dependency rather than adding a provider SDK. This keeps Auth0 at the outer OIDC adapter boundary and avoids dependency-lock churn.

## Steps
1. Reconcile VS-15 closeout and activate VS-16 governance state.
2. Extend `apps/web/src/lib/oidc.ts` with provider-neutral issuer/client-secret/audience helpers and runtime-only discovery.
3. Add Authorization Code + PKCE routes:
   - `/auth/login`: generate PKCE verifier/challenge + state; store one-time HttpOnly transaction cookie; redirect to provider.
   - `/auth/callback`: validate transaction/state, exchange code, require access token, set `kairo_access_token`, clear transaction cookie and redirect to the requested safe relative return path.
   - `/auth/logout`: clear local token and redirect through discovered end-session endpoint when available.
4. Replace the Neon credential form with Auth0 Universal Login entry points:
   - email/password login/signup via `/auth/login` and `screen_hint=signup`;
   - Google via `/auth/login?connection=google-oauth2`.
5. Remove Neon-specific same-origin auth proxy/session-action runtime usage and keep compatibility redirects for `/session/bootstrap`, `/session/refresh` and `/sign-out` where useful.
6. Preserve `kairo_access_token` as the server-only API bridge so existing Kairo server API clients and Workspace/Brand authorization remain unchanged.
7. Add deterministic tests for safe return-path validation, transaction parsing and auth URL behavior without network calls where feasible.
8. Run CI, Security baseline, Product Intake, preflight, typecheck, tests and build.
9. Freeze exact candidate SHA and stop for human certification/merge. Release/deployment/production-enable remain separate.

## Required runtime configuration
Web (Vercel):
- `OIDC_ISSUER=https://dev-8pkx2k6rewsss4ph.us.auth0.com/`
- `OIDC_CLIENT_ID=qhoCd5JLiQp4lzELHDB1KxfASDgv8YWs`
- `OIDC_CLIENT_SECRET=<secret entered directly in Vercel>`
- `OIDC_AUDIENCE=urn:kairo:api`
- `KAIRO_API_URL=<existing Kairo API URL>`

API (Render) after certification/release authorization:
- `OIDC_ISSUER=https://dev-8pkx2k6rewsss4ph.us.auth0.com/`
- `OIDC_AUDIENCE=urn:kairo:api`
- `OIDC_JWKS_URI=https://dev-8pkx2k6rewsss4ph.us.auth0.com/.well-known/jwks.json`

No Client Secret is required by the API.

## Production application URLs already configured in Auth0
- Login URI: `https://kairo-two-plum.vercel.app/auth/login`
- Callback: `https://kairo-two-plum.vercel.app/auth/callback`
- Logout: `https://kairo-two-plum.vercel.app`
- Web origin: `https://kairo-two-plum.vercel.app`

Production deployment is not authorized by this plan.
