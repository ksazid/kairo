# VS-17 — Auth login UI correction

## Goal
Restore a conventional Kairo sign-in experience after the Auth0 provider migration without moving password handling back into Kairo.

## UX
- Manual sign-in is primary.
- Kairo collects only the email/identifier and then redirects to Auth0 Universal Login for the password step.
- Google remains the only social option for this slice.
- Google uses a proper multi-color provider mark rather than a text `G`.
- Signup remains available through Auth0 Universal Login.
- Apple, GitHub and passkeys are explicitly deferred improvements.

## Security boundary
Kairo must not receive, log, persist or proxy the user's password. The Auth0-hosted prompt owns password entry and credential verification.

## Visual direction
Use the existing Kairo product design tokens, spacing, radii and typography. Keep the surface compact, responsive, keyboard-accessible and visually consistent with the application shell.

## Scope
`apps/web/app/sign-in/**`, `apps/web/app/auth/login/route.ts`, `apps/web/app/globals.css`, related tests/documentation only.
