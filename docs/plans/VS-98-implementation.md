# VS-98 Implementation Plan — Approved Home Intelligence Recovery

## Authority

- `product/PRD.md` FR-02/03/04/06/07/09/11/18
- `product/TRD.md`
- `product/DESIGN.md`
- Product Owner correction/implementation approval in the 2026-08-26 release-recovery session
- `docs/slices/VS-98.md`

## Implementation sequence

### 1. Recover private Home media

Reuse the already-written VS-96 private S3-compatible media boundary rather than adding a second storage system.

- Add migration `0030_home_media_inputs.sql` for Brand-scoped media metadata and `simple_creation_requests.media_asset_ids`.
- Extend the existing private object-storage SigV4 boundary with bounded signed PUT support.
- Store media binaries in private object storage with Workspace/Brand/asset scoped keys.
- Store metadata and lifecycle in PostgreSQL and mirror ready media into the existing Kairo Content Asset Library.
- Expose authenticated Brand-scoped begin/complete/list APIs.
- Validate media IDs again when a Simple Creation starts.

### 2. Replace the incorrect format workflow

- Extend supported Home execution formats to Post, Carousel, Reel and Video.
- Keep `Auto` as the user-facing default.
- Reuse deterministic `recommendMyIdea` scoring, accepted Brand Learnings and attached-media cues to resolve Auto without a separate CTA.
- Debounce the Home inference request; never require a `Recommend format` click.
- Preserve explicit user override until the user chooses Auto again.
- Make `AI Generate` the only creation CTA.

### 3. Conditional Presenter

- Load the existing Brand Presenter eligibility projection on Home.
- Show Presenter only for video-capable execution (Reel/Video) and only when the configured Brand Presenter is eligible.
- Keep `None` default and retain server-side `presenterId` eligibility validation.

### 4. For You direct generation

- Keep existing recommendation card geometry.
- Expose recommended format in user language.
- Add one compact selected-card action surface instead of a large control set on every card.
- Reuse the same Auto/manual format and optional Presenter generation contract.

### 5. Repair Hunter discovery

- Register the existing bounded RSS/Atom adapter in `createHunterToolGateway` so sector packs that already request RSS no longer degrade simply because the API omitted the adapter.
- Keep Hacker News, Bluesky and optional YouTube adapters.
- Return evidence/candidate/opportunity/degraded information to Home and distinguish no-evidence from no-qualified-opportunity states.
- Keep zero opportunity valid and do not synthesize filler.

### 6. Canonical Brand Intelligence Context

- Add one pure domain projection over Brand + active Brand Brain fields.
- Include concise Identity, Positioning, Audience, Voice, Content Strategy, Goals, Boundaries and accepted Performance Memory where present.
- Use latest authoritative field update to form a versioned context identifier.
- Reuse this projection in Hunter.
- Resolve it at authenticated application boundaries and pass it to Researcher, Strategist, Drafter and Critic inputs; worker roles do not query PostgreSQL.

### 7. Onboarding truthfulness

- Preserve the existing one-URL onboarding and Knowledge Source lifecycle.
- Do not fake data when blocked sites cannot be fetched.
- Make `learning-limited` a visible Brand/Home state and ensure downstream Hunter/generation sees the real sparse Brand context rather than silently assuming it is complete.
- Reuse existing source-specific connectors only where already authorized; generic public fetch remains fail-closed for blocked providers.

### 8. Verification

Run focused tests first, then repository gates:

- Home intelligence unit tests including Video and media cues.
- Home frozen contract regression: no `Recommend format`, working media controls, visible Auto/Post/Carousel/Reel/Video, AI Generate.
- API media tests: auth, signed upload lifecycle, type/size bounds, cross-Brand rejection.
- Simple Creation tests: media IDs, Video format and Presenter validation.
- Hunter route/tool tests including RSS and degraded/zero evidence reporting.
- Brand Intelligence projection tests and worker context tests.
- Next production build + API/worker/domain tests.
- `npm run governance:validate`, `npm run preflight`, Security, Product Intake, CI.
- Production-equivalent authenticated journey evidence required before certification.

## Non-goals

- New primary navigation.
- New public bucket or permanent binary URL model.
- A second media store.
- Multi-presenter provider redesign.
- Heavy automatic image/video generation provider work.
- New paid discovery provider.
- Autonomous publishing.
- Certification, merge or deployment without later exact-SHA approval.