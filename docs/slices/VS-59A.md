# VS-59A — Content Asset Library Foundation

## User job
Give each Brand a calm, reusable place to organize content assets before composing or adapting content, without adding complexity to onboarding.

## Scope
- Brand-scoped Content Assets secondary workspace.
- Multiple named libraries per Brand.
- Persist library metadata and indexed asset metadata with account/Brand isolation.
- Provider connector contract for future external libraries.
- Google Drive represented as a supported future provider state, but no OAuth, credentials, network calls, or indexing jobs in this slice.
- Search/filter indexed metadata by library, media kind and text.
- Add Content Assets to More and a contextual Content Studio entry.
- Preserve asset provenance/provider references.

## Trust boundary
Content Assets are production inputs, not Brand Brain truth. Library or asset records must never automatically create or confirm Brand Brain fields or Knowledge sources.

## Provider boundary
The API/web do not call Google Drive. A connector interface defines future provider behavior; VS-59A ships no live provider implementation and no secrets/configuration.

## UX
Content Assets is a secondary Kairo surface. Desktop primary navigation remains unchanged. Mobile uses More. The page prioritizes libraries, search/filter and asset browsing; connection status is explicit and provider setup is clearly deferred rather than presented as a working OAuth action.

## Acceptance criteria
- Multiple libraries can exist for one Brand.
- Account/Brand isolation is enforced in persistence and service access.
- Indexed asset metadata retains provider/external reference provenance.
- Deterministic search/filter behavior is covered by tests.
- Connection state communicates connected, not connected and needs attention without relying on color alone.
- No external provider/network call is possible from the shipped connector foundation.
- No Brand Brain mutation is performed.
- More and Content Studio link to the Brand-scoped Content Assets route.
- Desktop/mobile hierarchy, keyboard focus and empty/error states follow `product/DESIGN.md`.
- Product Intake, Security baseline, CI and UI Review pass on one exact candidate SHA.

## Non-goals
- Google OAuth consent or token storage.
- Google Drive API calls, webhook/watch channels or background indexing.
- Uploading/copying binary assets into Kairo storage.
- Media transformation.
- Brand Brain evidence ingestion from assets.
- Deployment, release or production enablement.
