# VS-16R implementation plan — Auth0 production readiness

## Authority
FR-01, DEC-001, VS-16R. Corrective work only.

## TDD sequence
1. Add red tests for a retryable async singleton used by OIDC discovery:
   - successful discovery is cached;
   - concurrent calls share one in-flight request;
   - rejection evicts only the failed in-flight value;
   - a later call retries and can succeed.
2. Implement the minimal retry-safe discovery cache in `apps/web/src/lib/oidc.ts`.
3. Add a safe login-start failure response around OIDC discovery/configuration in `apps/web/app/auth/login/route.ts`; do not expose provider internals or secrets.
4. Preserve existing PKCE/state/signed transaction-cookie semantics and server-only access-token bridge.
5. Run web tests/typecheck/build plus repository preflight/runtime verification, Security baseline and Product Intake.
6. Freeze the runtime head; transition through testing and exact-SHA certification.
7. Stop for human certification + merge approval.
8. After merge, a new release/deployment/production-enable approval is required before attempting production smoke. Real smoke must prove email sign-in, Google sign-in, callback, Kairo API session and logout.

## Explicit non-actions
- no Client Secret changes through Git/chat;
- no Auth0 dashboard mutation in this implementation slice;
- no Render/Vercel environment mutation before a separately approved deployment gate;
- no database migration;
- no VS-22 runtime activation until this correction is closed.
