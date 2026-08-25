# VS-96 Implementation Plan — Home Media Inputs and Optional Presenter

## Design read

Home is a calm, content-first creation surface. The user job is to supply an idea/reference, optionally attach media or an eligible Presenter, accept/adjust Kairo's format recommendation, then start generation. Density stays compact; attachments and Presenter are progressive, contextual controls rather than new permanent panels.

## Execution plan

### 1. Governance and contracts

- Activate VS-96 with the Product Owner's explicit scope + implementation approval.
- Promote only FG-HOME-001/002/003.
- Preserve DEC-012 Presenter semantics and the existing private S3-compatible storage boundary.
- Add deterministic tests before implementation where practical.

### 2. Private media upload boundary

- Extend `apps/api/src/private-object-storage.ts` with a bounded presigned-PUT signer; keep credentials server-side.
- Generate opaque Brand-scoped object keys under a dedicated `media/` namespace.
- Add upload metadata persistence with pending/completed/expired truth.
- Verify uploaded object existence/type before indexing completion.

### 3. Reuse Content Asset Library

- Do not add a competing media subsystem.
- Completed Home uploads are indexed into one deterministic Brand-scoped `manual` library labelled `Kairo Media`.
- Store the private object key in provider metadata; never persist temporary signed URLs.
- Expose signed preview URLs only through authenticated Brand-scoped reads.

### 4. Simple creation media references

- Add a forward-only migration for bounded media asset IDs on `simple_creation_requests` plus upload-intent records.
- Extend the simple-creation contract/store/view with media references.
- Resolve IDs server-side against the authenticated Brand before persistence.
- Preserve zero-media behavior unchanged.

### 5. Home API bridge

- Add authenticated API routes to begin/complete/list Home media.
- Add the Next.js `/api/home/media` bridge so client code never receives API bearer tokens or object-storage credentials.
- Direct file bytes go browser -> private R2; Kairo Web only exchanges metadata and scoped signed URLs.

### 6. My Idea UX

- Enable Photo and Video buttons with hidden native file inputs.
- Successful uploads render compact attachment chips/thumbnail treatment and automatically join Media.
- Enable `Media` as an accessible modal picker with truthful loading/empty/error states and multi-select.
- Keep the existing input boundary, spacing and tool row; no new page or permanent panel.

### 7. Presenter UX

- Home loads the existing Presenter eligibility projection once per Brand.
- Pass only an eligible Presenter's minimal public identity to My Idea.
- After a format recommendation is present, render Format first, then Presenter if eligible, then generation action.
- `None` remains default; selector disappears completely when unavailable.

### 8. AI Generate action

- Rename the post-recommendation creation action to `AI Generate`.
- Reuse `<KairoIcon name="sparkles" />`, exactly the icon family already used by `Get recommendations`.
- Preserve primary purple treatment and accessible loading/disabled states.

### 9. For You integration

- Keep frozen recommendation card geometry and visual hierarchy unchanged.
- Continue using the card to seed My Idea. The creation boundary then exposes Format, eligible Presenter and `AI Generate`.
- Do not add a persistent presenter picker to every recommendation card.

### 10. Verification

- Unit/API tests: upload authorization, expired completion, unsupported media, cross-Brand selection, media persistence, presenter unchanged, no-media regression.
- Web tests: Photo/Video/Media enabled, AI Generate + sparkles contract, Presenter conditional/default None, frozen Home hierarchy unchanged.
- Run clean PostgreSQL migrations, typecheck, test, production builds, governance validation and repository preflight.
- UI Review at desktop and 390px mobile; verify no horizontal overflow, keyboard/focus and reduced-motion.
- Stop at exact-SHA certification gate. Do not merge/release/deploy automatically.

## Technical safety bounds

Initial direct-upload request validation is intentionally bounded to common renderable media:

- Images: JPEG, PNG, WebP; maximum 25 MiB.
- Video: MP4, QuickTime/MOV, WebM; maximum 512 MiB.
- Maximum 12 selected media assets per simple creation, matching the existing Content Asset Selection bound.
- Presigned upload URL lifetime: 10 minutes.
- Signed preview URL lifetime: 10 minutes.

These are abuse/performance guardrails, not claims about downstream model capability.

## Expected touched paths

- `apps/api/migrations/0030_home_media_inputs.sql`
- `apps/api/src/private-object-storage.ts`
- `apps/api/src/home-media.ts`
- `apps/api/src/home-media-routes.ts`
- `apps/api/src/server.ts`
- `apps/api/src/simple-creation.ts`
- `apps/api/src/simple-creation-postgres.ts`
- relevant API tests
- `apps/web/app/api/home/media/route.ts`
- `apps/web/src/lib/home-media-api.ts`
- `apps/web/src/lib/simple-creation-api.ts`
- `apps/web/app/page.tsx`
- `apps/web/app/my-idea-composer.tsx`
- `apps/web/app/home-vs85.module.css`
- relevant web contract tests
- `docs/plans/KAIRO-UI-FUNCTIONALITY-GAPS-2026-08-25.md`
- VS-96 delivery/governance state
