# VS-15 Implementation Plan — Instagram Reel and Image Carousel Publishing

## Starting point

Kairo already has deterministic publishing state, retries, human-approved version lineage and an `InstagramProfessionalAdapter` for one image. However, `PgPublishingExecutionStore.claimNext()` currently emits `mediaUrls: []`, so the real Postgres worker path cannot deliver media even to the existing image adapter.

VS-15 fixes that end-to-end gap first, then extends the same adapter for Reels and image carousels.

## Provider contract

Use Meta's official Instagram API behavior:

### Reel

1. POST `/{ig_user_id}/media` with `media_type=REELS`, `video_url`, caption and bounded `share_to_feed` option.
2. Poll `/{container_id}?fields=status_code,status` with a bounded deterministic policy.
3. `FINISHED` → POST `/{ig_user_id}/media_publish` with `creation_id`.
4. `ERROR` → fail safely.
5. Exhausted readiness polling → return an uncertain/retryable-safe result without claiming publication.

### Image carousel

1. Create 2–10 image child containers with `is_carousel_item=true`.
2. Create parent with `media_type=CAROUSEL`, child IDs and caption.
3. Publish parent using `media_publish`.
4. Stop immediately if any child or parent creation fails.

Mixed video carousels are intentionally excluded from VS-15.

## Domain model changes

Add:

```ts
type PublishMediaKind = "image" | "video";
interface PublishMediaItem { kind: PublishMediaKind; url: string }
interface PublishOptions { instagram?: { shareToFeed?: boolean } }
```

Extend:
- `PublishContentType` with `reel`;
- `PublishCapability` with `publish-reel`;
- `PublishCommand` with `mediaItems` and `options`.

Validation matrix:

| Channel/content | Media rule |
| --- | --- |
| LinkedIn text | zero media |
| Instagram image | exactly 1 image |
| Instagram reel | exactly 1 video |
| Instagram carousel | 2–10 images |
| unsupported combinations | manual-required / validation rejection at scheduling boundary |

The API/domain accepts only media descriptors. The worker independently applies public-safe URL checks immediately before provider network calls.

## Persistence

Create migration `0014_instagram_rich_publishing.sql`:
- add `media_items jsonb not null default '[]'::jsonb` to `publish_commands`;
- add `publish_options jsonb not null default '{}'::jsonb`;
- replace the content-type constraint with an explicit constraint that includes `reel`.

Update `PgPublishingRepository` to persist/read the fields.
Update `PgPublishingExecutionStore` to hydrate exact media/options into `PublishingJob`.

No token/credential values are stored in either JSON field.

## Worker changes

Replace ambiguous URL-only media input with typed `mediaItems`. Preserve compatibility internally only where needed by existing tests.

`InstagramProfessionalAdapter.supports()` validates content/media shape plus public-safe URLs.

Adapter methods are deterministic and provider-specific:
- single image: existing create → publish;
- Reel: create → bounded status poll → publish;
- image carousel: child creates → parent create → publish.

Inject sleep/poll configuration so tests do not wait in real time.

## TDD order

### Red 1 — domain
- valid image/Reel/carousel command creation;
- invalid count/kind combinations rejected;
- `publish-reel` required for automatic Reel scheduling;
- secrets cannot be part of media/options structures.

### Red 2 — persistence
- repository round-trips media/options;
- execution-store claim hydrates exact media/options instead of `[]`.

### Red 3 — adapter
- existing image flow still passes;
- Reel `IN_PROGRESS → FINISHED → publish`;
- Reel `ERROR` fails with correlation ID;
- bounded Reel processing timeout does not claim published;
- image carousel creates children, parent, then publishes;
- child failure prevents parent;
- private/unsafe URLs fail closed;
- 429/5xx behavior retains retry metadata;
- no token appears in results.

### Green
Implement only enough code/migration to satisfy the tests.

### Review / gates
- diff scope review;
- `npm run governance:validate`;
- `npm run preflight`;
- full CI/runtime/PostgreSQL clean migration;
- Security baseline;
- Product Intake;
- exact-SHA certification request.

## Non-goals preserved

No OAuth, Insights, UI, Stories, mixed-video carousel, media rendering, autonomous publishing, release, deployment or production enablement.
