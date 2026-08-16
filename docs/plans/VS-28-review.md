# VS-28 — Verification review

## Reviewed candidate baseline
Implementation head reviewed before certification metadata: `c782ccad2fca2c1a586cb260aa16a1e35717c2cd`.

## Acceptance review
- Signed-out `/` redirects directly to `/auth/login?returnTo=/`; the former Kairo sign-in card is removed.
- Users with a valid identity but no Workspace redirect from `/` to `/onboarding`.
- `/onboarding` requires authentication, prevents already-onboarded users from re-entering setup, and reuses the existing governed `createWorkspaceAction` so successful setup continues to Brand Brain.
- `/sign-in` is recovery-only and contains no email or password field.
- `/auth/login` remains Authorization Code + PKCE and connection-neutral by default; direct social selection is allow-listed to `google-oauth2` and `apple` only.
- The callback, ID-token/JWKS validation, session-cookie implementation, API authorization and Workspace/Brand authorization code are unchanged by this slice.
- `apps/web/public/kairo-auth-logo.svg` provides a stable Kairo-specific logo URL for Auth0 Application Logo configuration.
- Regression coverage in `apps/web/src/auth-entry.test.ts` locks the root redirect, onboarding boundary, recovery-only sign-in, bounded social providers and logo asset.

## Exact implementation verification
For `c782ccad2fca2c1a586cb260aa16a1e35717c2cd`:
- Product Intake #475: passed.
- Security baseline #555: passed.
- CI #623: passed.
- CI included dependency installation, Hermes contract/container checks, clean PostgreSQL 18 migration verification, production dependency audit, governance/preflight, runtime verification/tests, Next dashboard production build and artifact upload.

## Security review
No Kairo-owned password collection or password proxying was introduced. No secret, client secret, provider credential, API authorization policy, callback token exchange or session cryptography was broadened. Direct social connection selection rejects values outside the explicit Google/Apple allow-list.

## UX review
The normal signed-out product entry now has one authentication hop: Kairo root to Auth0 Universal Login. First-login Workspace setup is separated into `/onboarding`, while returning users retain the existing product shell. The visual authority remains Kairo's quiet/premium baseline; Auth0 is responsible for rendering the actual email/password and enabled social controls.

## Explicitly unproven / external configuration
- Auth0 tenant application-specific branding has not been mutated by repository code. The Kairo Web Application Logo still needs to be pointed at the deployed `/kairo-auth-logo.svg` URL and the Universal Login template/branding must use the Kairo application identity rather than NoorPath tenant-global branding.
- Google must be enabled for Kairo Web in Auth0 if not already enabled.
- Apple is code-ready as a bounded connection name but is not operational or tested until its Auth0/Apple Developer configuration is completed.
- No deployed browser end-to-end login was performed in this slice because deployment/release is not authorized here.

## Verifier verdict
`READY_FOR_EXACT_HEAD_GATES` — implementation, source-contract tests, security review and production build are green. Certification must bind a fresh exact candidate SHA that includes this review/governance evidence; release and production enablement remain separate.
