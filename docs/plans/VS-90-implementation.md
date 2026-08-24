# VS-90 Avatar / Presenter implementation plan

Status: planning only. Runtime work is blocked until issue #188 is approved and VS-89 issue #187 is resolved or explicitly deferred.

## Execution method

When activated, use repository governance first, then UI UX Pro Max → Impeccable → Emil where motion helps → Ponytail → Superpowers implementation planning/TDD/review. `product/DESIGN.md` and `product/DESIGN-APPROVALS.md` remain authoritative over all design skills.

## Phase 1 — Contracts and domain foundation

1. Add typed Presenter DTOs and eligibility projection to `packages/contracts`.
2. Add Brand-scoped Presenter domain model and state transitions.
3. Add optimistic versioning and fail-closed eligibility rules.
4. Add tests for cross-Brand denial, stale-version writes, disabled/provider-unavailable states, and `None` default.

Expected model:
- PresenterProfile
- PresenterSuggestion
- PresenterProviderBindingRef
- PresenterEligibility
- PresenterTestClip

No provider credentials are part of these contracts.

## Phase 2 — Persistence and API

1. Add explicit migration for Brand-scoped presenter profiles and test-clip/job lineage.
2. Add repository/application use cases.
3. Add authenticated API routes under Brand scope.
4. Validate all referenced media objects are owned by the same Workspace/Brand.
5. Emit problem-details errors for concurrency, unavailable provider, invalid media, and access denial.

## Phase 3 — AvatarProvider boundary

1. Introduce a server-side replaceable `AvatarProvider` port.
2. Implement provider health/capability projection separately from Presenter domain truth.
3. Add a configured custom/self-hosted endpoint adapter as the first production-capable boundary if approved.
4. Keep a test-only fake provider for deterministic tests; never advertise it as production-ready.
5. Validate provider output before private object persistence.
6. Persist provider task/version lineage without credentials.

## Phase 4 — Brand Avatar surface

1. Add Brand → Avatar as a Brand subpage/surface; no primary-nav change.
2. Empty state: one compact `Create avatar` action.
3. Build Kairo suggestions from existing Brand context rather than a long form.
4. Review/accept suggestions in a short single-surface flow.
5. `Create & Save` is the primary action.
6. Existing Presenter shows identity and readiness with `Manage`/Edit.
7. Test Clip is optional and only enabled when provider capability is healthy.
8. Provider-unavailable state is plain-language and non-destructive.

## Phase 5 — Creation integration

1. Add Presenter selector to My Idea / For You only when an eligible Presenter exists.
2. Default is `None`.
3. Recommendation may pre-highlight Presenter suitability but cannot force selection.
4. Persist selected Presenter profile/version with the content execution lineage.
5. No Presenter option appears when the profile is disabled or provider-unavailable.

## Phase 6 — Render / Preview / Approval integration

1. Media planning completes before presenter generation.
2. Presenter provider execution produces private media.
3. Compositor creates the exact final asset.
4. Preview shows the exact final rendered output.
5. `Approve & Lock` freezes the Presenter profile version/provider result/final asset lineage.
6. Any edit/regeneration after approval produces a new version requiring reapproval.
7. Deterministic Publisher continues to receive only the exact approved final asset.

## UI contract

Brand Avatar surface should remain calm and compact:
- no dashboard grid;
- no provider jargon in normal flow;
- no large AI decoration;
- one obvious primary action;
- suggestions clearly distinguish proposed vs saved values;
- desktop/mobile share the same hierarchy;
- motion only for state transitions and test-clip progress, under normal Kairo motion limits.

## Verification

Before certification:
- migration on clean PostgreSQL 18;
- contract/domain/API tests;
- tenant-isolation regression tests;
- provider-output validation tests;
- web tests for empty/ready/unavailable/disabled states;
- creation selector tests including default None;
- exact asset/version reapproval tests;
- responsive + accessibility + UI Review;
- `npm run governance:validate` and `npm run preflight`;
- full Security baseline and CI on exact candidate SHA.

## Release boundary

No merge, release or production-enable is implied by this plan. Those remain exact-SHA human gates.