# VS-89 Implementation — Brand, Sources and Channels

## Design read

Authenticated product profile/configuration flow. The user should understand and correct Brand context quickly, then manage evidence sources and publish/Insights destinations without being exposed to Kairo's internal Brand Brain or adapter architecture.

## Implementation

1. Keep `/brands/[brandId]/brain` as the compatibility route but render the approved user-facing `Brand` experience.
2. Group the existing Brand Brain field taxonomy into Identity, Audience, Voice & Style, and Content Pillars without changing storage keys or section values.
3. Use a small client-only local edit state for each field; writes continue through the existing server action and exact-version optimistic concurrency contract.
4. Retire the separate form-first Review & Control page by redirecting it to Brand.
5. Keep Knowledge Sources on Brand and remove authenticated destination management from Sources.
6. Add `/brands/[brandId]/channels` as the normal channel-management surface using existing `getChannelAccounts`, Meta health and OAuth connection contracts.
7. Fail closed when current channel state cannot be read; do not infer disconnected state or expose connection mutation controls.
8. Keep account groups under Advanced routing and normalize the specialist route back to Brand/Channels language.

## Explicit non-implementation

- Avatar/Presenter: deferred to a dedicated slice because no current domain persistence/provider binding exists.
- Settings → AI & Media Providers: deferred to a dedicated slice because no current provider configuration persistence contract exists.
- No API, worker, database, migration, publishing or analytics-collection changes.
- No deployment, release or production-enable.

## Verification

- Brand profile view-model tests.
- Brand UI source-contract tests.
- Existing Brand/source/channel/OAuth tests through full workspace CI.
- Product Intake.
- Security baseline.
- Repository preflight/governance.
- Next.js production build and route manifest.
- Scope-drift inspection before certification.
