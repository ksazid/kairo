# Kairo Auth0 Universal Login — Production Runbook

## Purpose

Configure a **dedicated Auth0 tenant for Kairo** so Kairo authentication is isolated from NoorPath branding and provider configuration while preserving Kairo's existing OIDC security boundary.

This is an operational/release configuration task, not a new Kairo product feature slice.

## Security boundary

- Auth0 owns credential collection and authentication UX.
- Kairo does not receive or process user passwords.
- Kairo Web uses Authorization Code + PKCE/state and exchanges the callback code server-side.
- Kairo API validates Auth0 access tokens by issuer, audience and JWKS.
- Workspace/Brand authorization remains Kairo-owned.

## Kairo Universal Login target

The hosted login should remain quiet and product-first:

- Kairo mark centered above the prompt;
- page background `#F8FAFC`;
- white login widget;
- Kairo primary indigo `#4F46E5`;
- dark neutral text;
- restrained 8–12px radii;
- no gradients, illustrations, glassmorphism or generic AI decoration;
- email/password as the primary database connection;
- Google as the first social connection;
- Apple prepared later when Apple Developer credentials are available.

The repository asset is:

`apps/web/public/kairo-auth-logo.svg`

Its deployed URL is `<KAIRO_WEB_ORIGIN>/kairo-auth-logo.svg`.

## Required one-time manual step

A ChatGPT connector for Auth0 is not available. Tenant creation and Auth0 account login therefore remain manual.

1. In Auth0, create a **dedicated Kairo tenant** (prefer an EU tenant for the Kairo deployment geography).
2. Do not reuse the NoorPath tenant.
3. Decide Kairo's **stable production web origin** before configuring callbacks. Do not use a deployment-specific Vercel URL that changes on every deployment.
4. Generate a temporary Auth0 Management API token (or an M2M credential/token) with the minimum scopes needed by the configurator:
   - `read:clients`
   - `create:clients`
   - `update:clients`
   - `read:resource_servers`
   - `create:resource_servers`
   - `update:resource_servers`
   - `read:connections`
   - `create:connections`
   - `update:connections`
   - `read:branding`
   - `update:branding`

Do not paste that token into source control or commit it anywhere.

## Reproducible tenant configuration

Preview the intended changes without mutating Auth0:

```bash
AUTH0_DOMAIN="<kairo-tenant>.eu.auth0.com" \
KAIRO_WEB_ORIGIN="https://<stable-kairo-app-origin>" \
node scripts/configure-kairo-auth0.mjs --plan
```

Apply after the tenant and temporary Management API token exist:

```bash
AUTH0_DOMAIN="<kairo-tenant>.eu.auth0.com" \
AUTH0_MGMT_TOKEN="<temporary-token>" \
KAIRO_WEB_ORIGIN="https://<stable-kairo-app-origin>" \
node scripts/configure-kairo-auth0.mjs --apply
```

The configurator is intentionally idempotent where practical. It:

1. creates/updates the `Kairo Web` Regular Web Application;
2. sets exact production callback/logout/web-origin values;
3. assigns the deployed Kairo logo;
4. creates/updates the `Kairo API` resource server with audience `urn:kairo:api` and RS256;
5. finds or creates an Auth0 database connection and enables it for `Kairo Web`;
6. applies Kairo basic Universal Login branding;
7. refines the default Universal Login theme when Auth0 has materialized a default theme.

If Auth0 has not materialized a theme yet, open **Branding → Universal Login**, Save/Publish once, then rerun the configurator. Basic Kairo branding is already applied before that step.

## Google connection

Google is deliberately not created by the script because its OAuth client ID/secret are external provider secrets.

Configure a Kairo-owned Google OAuth web client and use Auth0's Google social connection for the Kairo tenant. Enable that connection only for `Kairo Web` (and later the Kairo native/mobile application when it exists).

Do not copy NoorPath provider credentials blindly. If an existing Google OAuth project is intentionally shared, add the new Kairo Auth0 redirect URI explicitly and document the shared ownership decision.

## Apple connection

Keep Apple disabled until Apple Developer credentials are ready. The Kairo login route already permits the Auth0 `apple` connection when configured; no additional password handling should be added to Kairo.

## Deployment values after Auth0 setup

### Kairo Web

```text
OIDC_ISSUER=https://<kairo-tenant>.eu.auth0.com/
OIDC_CLIENT_ID=<Kairo Web client id>
OIDC_CLIENT_SECRET=<secret store only>
OIDC_AUDIENCE=urn:kairo:api
KAIRO_API_URL=<production Kairo API origin>
```

### Kairo API

```text
OIDC_ISSUER=https://<kairo-tenant>.eu.auth0.com/
OIDC_AUDIENCE=urn:kairo:api
OIDC_JWKS_URI=https://<kairo-tenant>.eu.auth0.com/.well-known/jwks.json
```

The web and API issuer/audience must match exactly.

## Release smoke gate

Do not mark production authentication proven until all of the following pass against the stable production origin:

1. Signed-out `/` redirects into **Kairo-branded Auth0 Universal Login**.
2. Email/password signup succeeds.
3. Email/password login succeeds.
4. Google login succeeds once the Google connection is configured.
5. Callback returns to Kairo without exposing tokens in the URL after processing.
6. New account with no Workspace lands on `/onboarding`.
7. Workspace creation creates the initial Brand and continues into Kairo.
8. Existing account with a Workspace lands in the app.
9. Logout clears the Kairo session and Auth0 logout return is allowed.
10. Invalid issuer/audience access tokens remain rejected by the API.
11. NoorPath branding does not appear anywhere in the Kairo authentication journey.
12. Apple is labelled/configured only when its Auth0/Apple credentials are genuinely operational.

## Rollback

If the new Kairo tenant fails production smoke testing:

- do not mark authentication production-proven;
- revert deployment environment variables to the last known-good identity configuration only if that configuration is still explicitly approved;
- keep external publishing/pilot traffic disabled where authentication integrity cannot be established;
- preserve logs/evidence without recording secrets.
