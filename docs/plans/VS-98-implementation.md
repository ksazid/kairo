# VS-98 Implementation Plan — Approved Home Creation Recovery

## Authority

- `product/PRD.md`
- `product/TRD.md`
- `product/DESIGN.md`
- Product Owner correction/implementation approval in the 2026-08-26 recovery session
- Product Owner scope narrowing: defer URL-ingestion/onboarding reliability and Hunter-quality work; concentrate on Home UI, URL input, media uploads/library and direct creation
- `docs/slices/VS-98.md`

## Implementation sequence

### 1. Recover private Home media

Reuse the existing private S3-compatible storage boundary rather than adding another storage system.

- Add migration `0030_home_media_inputs.sql` for Brand-scoped MediaAsset metadata and `simple_creation_requests.media_asset_ids`.
- Extend the existing private object-storage SigV4 boundary with bounded signed PUT support.
- Store binaries under Workspace/Brand/asset scoped private keys.
- Keep metadata/lifecycle in PostgreSQL and mirror ready uploads into the existing Kairo Content Asset Library metadata without copying the binary.
- Expose authenticated Brand-scoped begin/complete/list APIs.
- Validate media IDs again when a Simple Creation starts.

### 2. Replace the incorrect format workflow

- Support user-facing Post, Carousel, Reel and Video execution formats.
- Keep `Auto` as the default.
- Reuse deterministic input/media cues and existing accepted Brand Learnings to resolve Auto without a separate CTA.
- Debounce automatic selection; never require a `Recommend format` click.
- Preserve explicit user override until the user selects Auto again.
- Make `AI Generate` the dominant creation CTA.

### 3. Direct generation to Content Preview

- Reuse the existing Research → Angle → Campaign → Drafter pipeline internally.
- Create the generated Content Asset through application-owned services.
- Persist selected Media references on the Content Version.
- Poll only a user-facing creation status from Home and route directly to the existing Content Preview when ready.
- Do not expose internal Research/Angle/Campaign workflow pages in the Home journey.

### 4. Conditional Presenter

- Load the existing Brand Presenter eligibility projection on Home.
- Show Presenter only for Reel/Video and only when the configured Presenter is eligible.
- Keep `None` available and retain server-side Presenter eligibility validation.

### 5. For You UI direct generation

- Use already-persisted Brand Opportunities only; do not modify Hunter in VS-98.
- Keep existing card geometry as far as the approved action controls allow.
- Show Post/Carousel/Reel/Video type in user language.
- Add compact format / optional Presenter / `AI Generate` controls after the user chooses a recommendation.
- Route successful generation directly to Content Preview.

### 6. URL input behavior

- Keep URL as an optional My Idea input using the existing explicit URL/research reader.
- Validate public HTTP(S) input.
- Do not add scraping engines, source-specific fallback logic or onboarding extraction changes in this slice.
- When the existing URL reader cannot use the source, return a concise user-facing failure and preserve the rest of the user's idea/media.

### 7. Verification

Run focused tests first, then repository gates:

- Home contract: no `Recommend format`; visible Auto/Post/Carousel/Reel/Video; working URL/Photo/Video/Media; AI Generate.
- Auto-format tests for text, URL and attached media cues.
- API media tests: authentication, signed upload lifecycle, type/size bounds and cross-Brand rejection.
- Simple Creation tests: media IDs, Video format, Presenter validation and direct generated Content Asset.
- For You existing-opportunity direct-generation UI tests.
- URL readable/failure-state UI tests against the existing reader only.
- Responsive/accessibility checks for changed Home controls.
- Production build + API/domain/web tests.
- `npm run governance:validate`, `npm run preflight`, Security, Product Intake and CI before certification.
- Production-equivalent authenticated journey evidence is required before certification.

## Explicitly deferred

- URL onboarding extraction/scraping reliability and source-specific fallback architecture.
- Arbitrary URL scraping improvements from My Idea beyond the existing reader.
- Hunter discovery/provider/source-routing/qualification fixes.
- Canonical Brand Intelligence Context or agent-context propagation refactor.
- Claims that Hunter `Get recommendations` is fixed by this slice.

## Non-goals

- New primary navigation.
- Public media bucket or permanent binary URLs.
- A second media store.
- Multi-presenter provider redesign.
- New paid discovery providers.
- Autonomous publishing.
- Certification, merge or deployment without later exact-SHA approval.
