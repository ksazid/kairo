# VS-16 — Auth login UI correction

## Goal
Correct the Kairo sign-in UX within the active Auth0 migration slice while preserving the provider-neutral identity boundary.

## UX
- Manual login is the primary path.
- Kairo collects the email/identifier only; Auth0 Universal Login owns password entry and credential verification.
- Google remains the only social login option in this correction.
- Use a proper multi-color Google provider mark, consistent button sizing and spacing.
- Signup remains available and routes to Auth0 Universal Login.
- Apple, GitHub and passkeys are deferred improvements.

## Security boundary
Kairo must not receive, log, persist or proxy passwords. The manual path is email-first on Kairo, followed by the Auth0-hosted password prompt.

## Visual direction
Use the existing Kairo design tokens, typography, radii and neutral product aesthetic. Keep the surface compact, responsive, semantic and keyboard-accessible.
