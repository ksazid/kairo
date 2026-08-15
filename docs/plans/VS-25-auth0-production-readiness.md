# VS-25 implementation plan — Auth0 production readiness

## Authority
FR-01, DEC-001, VS-25. Corrective work only.

## TDD sequence
1. Add red tests for the retryable async singleton used by OIDC discovery.
2. Implement retry-safe discovery caching in `apps/web/src/lib/oidc.ts`.
3. Add a safe `/auth/login` failure boundary that clears stale OIDC transaction state.
4. Keep callback transaction/config/secret failures inside the existing safe sign-in failure path.
5. Canonicalize only the API OIDC issuer trailing slash and test the normalization; preserve audience/JWKS verification.
6. Run web/API tests, typecheck/build, repository preflight/runtime verification, Security baseline and Product Intake.
7. Freeze the runtime head; transition through testing and exact-SHA certification.
8. Stop for human certification + merge approval.
9. After merge, require a new release/deployment/production-enable approval before production smoke. Real smoke must prove email sign-in, Google sign-in, callback, Kairo API session and logout.

## Evidence already found
- Account/session resolution is provider+subject based and does not require an email claim.
- The prior manual-first Auth0 production deployment was blocked by Vercel daily build quota.
- CI #533 passed clean PostgreSQL 18 migrations and dependency audit, then correctly rejected the initial non-numeric corrective slice ID before runtime verification.

## Explicit non-actions
- no Client Secret changes through Git/chat;
- no Auth0 dashboard mutation in this implementation slice;
- no Render/Vercel environment mutation before a separately approved deployment gate;
- no database migration;
- no VS-22 runtime activation until this correction is closed.
