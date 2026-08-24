# VS-90 Implementation Plan — Brand Avatar and Optional Presenter

## Goal

Implement the approved optional Brand presenter profile and a real, durable Presenter choice during simple creation without changing Kairo's core agent pipeline or pretending an avatar-rendering provider exists.

## Sequence

### 1. Contracts and migration

- Add `BrandPresenter` DTO/input types to `@kairo/contracts`.
- Add migration `0029_brand_presenters.sql`:
  - `brand_presenters`
  - Workspace + Brand scope and one-presenter-per-Brand uniqueness
  - status/mode checks
  - version/timestamps
  - nullable `simple_creation_requests.presenter_id`
- Preserve `None` by default.

### 2. API domain boundary

Add small dedicated modules following existing simple-creation/content-asset patterns:

- `brand-presenter.ts`
- `brand-presenter-postgres.ts`
- `brand-presenter-routes.ts`
- focused tests

Rules:
- authenticate first
- authorize Brand through `KairoService`
- exact-version update
- never return/store provider credentials
- capabilities report unavailable until a real provider adapter exists

### 3. Creation intent

Extend simple creation with optional `presenterId`:

- service validates presenter ownership + `ready` status before creating the durable request
- Postgres store persists the reference
- public creation view returns selected presenter identity when present
- old requests/requests with no presenter remain unchanged

No Research/Strategist/Campaign behavior changes.

### 4. Web — Brand → Avatar

- Add `Avatar` to the Brand section navigation, not primary navigation.
- New `/brands/[brandId]/avatar` route using `KairoProductShell`.
- No-presenter state uses concise suggested setup from current Brand context.
- Existing-presenter state prioritizes presenter summary + Manage.
- Local form save with plain validation and error states.
- No fake provider controls; test/render capability is explained as unavailable.

### 5. Web — creation Presenter

- Fetch current Brand presenter server-side.
- Show Presenter selector only for a ready presenter.
- `None` first/default.
- Submit nullable presenter ID through existing server action and API client.

### 6. Quality gates

Focused tests:
- presenter validation/service/store
- route auth and cross-Brand denial
- simple creation presenter validation and persistence
- web API/client/action contracts

Repository gates:
- migration chain 0001–0029 on clean PostgreSQL 18
- contracts/API/web typecheck
- relevant unit tests
- accessibility/responsive/static UI checks where available
- `npm run governance:validate`
- `npm run preflight`
- full Security + CI through PR

## Design review checklist

- optional, never forced
- Avatar is Brand sub-surface only
- quiet/editorial hierarchy; no dashboard card wall
- no gradient/glow/theatrical AI
- suggestions visibly distinct from confirmed values
- one clear primary action
- provider jargon absent from normal path
- mobile remains same five-item bottom navigation
- motion only if it materially clarifies local state and remains under 300ms/reduced-motion safe

## Stop conditions

Stop and surface a governance decision instead of improvising if implementation would require:

- provider credential/config persistence
- biometric/face/voice cloning media
- worker/media pipeline changes
- autonomous presenter selection
- changing human approval or publishing safeguards
- a new external dependency not already justified by the repo

## Handoff gate

When implementation is complete, open a PR and run Product Intake, Security and CI. Do not mark certification approved or merge/release/deploy without a separate Product Owner exact-SHA approval.