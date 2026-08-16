# VS-28 — Kairo root login entry implementation plan

## Design read
This is a security-sensitive product entry flow for returning and first-time Kairo users: quiet, premium, minimal Kairo identity with Auth0 Universal Login owning credentials and Kairo owning only post-auth Workspace/Brand setup.

## Implementation
1. Change signed-out `/` from an intermediate Kairo card to a server redirect into `/auth/login?returnTo=/`.
2. Move the existing Workspace + Brand creation form from `/` to `/onboarding`.
3. On `/`, route an authenticated user with no Workspace to `/onboarding`; returning users keep the existing dashboard behavior.
4. On `/onboarding`, require a valid session, redirect users with an existing Workspace back to `/`, and preserve `createWorkspaceAction` so successful setup continues to Brand Brain.
5. Convert `/sign-in` into a recovery-only surface for Auth0/configuration failures; it must not collect an email or password in the normal flow.
6. Keep default `/auth/login` connection-neutral so Universal Login renders all Kairo-enabled connections. Permit only the bounded direct connection values `google-oauth2` and `apple` when a caller intentionally chooses a provider.
7. Add `/kairo-auth-logo.svg` as a stable application-specific logo URL for Auth0 configuration.

## Auth0 tenant configuration required outside this repository
For the Kairo Web Auth0 application:
- Set Application Name to `Kairo Web` (or the approved final Kairo application name).
- Set Application Logo to the deployed Kairo logo URL, e.g. `https://<kairo-web-origin>/kairo-auth-logo.svg`.
- Enable the Auth0 database connection used for email/password.
- Enable Google for Kairo Web.
- Configure and enable Apple when Apple Developer credentials are ready; until then Apple is not operational and must not be claimed as tested.
- Ensure Universal Login/custom template uses application-specific `application.name` / `application.logo_url` rather than a NoorPath tenant-global identity.

## Mobile reuse
Keep the same Auth0 tenant/identity architecture and provider policy, but create/use a platform-appropriate native Auth0 application and callback for mobile rather than sharing a web client credential. The authorization boundary remains Authorization Code + PKCE; Workspace/Brand authorization remains in Kairo.

## Verification
- governance/preflight
- web typecheck
- web unit tests
- Next production build
- exact-head Product Intake, Security and CI
- browser verification after deploy: signed-out `/` -> Auth0; email/password; Google; callback; first user -> `/onboarding`; returning user -> app; logout -> signed-out root.
- Apple browser/native verification only after its Auth0/Apple connection is configured.
