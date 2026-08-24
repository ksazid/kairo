# VS-90 release observation

Status: released; post-release observation active.

Certified runtime SHA: `1da4665fa430468516f79e38984638369552b6e7`
Implementation merge commit: `6598d7898551a9518ef2e807f77e2fed4e9ee2e7`
Release/production-enable governance merge: `f4bd21753e406ecb82252b0aac50d8711007c348`
Release ID: `REL-008`
Rollback ID: `RB-008`

## Production rollout completed

- Neon project: `bitter-firefly-55924620`
- Production branch: `br-broad-dew-asjbqglh`
- Database: `kairo`
- Migration: `apps/api/migrations/0029_brand_presenters.sql`
- Neon migration ID: `2e7c3721-aa35-4243-973e-e97c68fdf14f`
- Temporary verification branch was deleted after successful commit.
- Render API production deployment reached live on commit `f4bd21753e406ecb82252b0aac50d8711007c348`; exact deployment reference is retained in post-release issue #192.
- Vercel production deployment reached READY on commit `3ac634f337653fce92e5ae177c2d534d80d11d5e`; exact deployment reference is retained in post-release issue #192.
- Canonical production domain: `kairo-two-plum.vercel.app`
- Avatar provider configuration: none; runtime remains fail-closed

## Proven production evidence

1. Migration 0029 was first applied on a temporary Neon branch and verified for the Presenter table, creation Presenter reference, scoped foreign key and supporting index.
2. The same tested migration was committed successfully to the production `kairo` database and the temporary branch was deleted.
3. A direct production schema query confirmed the expected Presenter persistence and scoped linkage exist.
4. Render API production reached `live`; startup logs show the API server listening and the existing Instagram publisher starting normally.
5. Render returned no error/fatal application logs in the new deployment window from `2026-08-24T22:41:17Z` through `2026-08-24T22:46:00Z`.
6. Vercel production reached `READY`; its build completed successfully and explicitly includes `/brands/[brandId]/avatar`.
7. Canonical production `/api/version` returned HTTP 200 with web release SHA `3ac634f337653fce92e5ae177c2d534d80d11d5e`.
8. Canonical production `/` returned the expected Auth0 HTTP 307 authorization redirect with callback to the production domain.
9. Vercel runtime error aggregation returned no errors in the immediate post-deploy window.
10. Git comparison proves the Render deployment differs from the certified runtime only by VS-90 governance files. The Vercel deployed tree differs only by those governance files plus the controlled web deployment gate file.
11. Root and `apps/web` Vercel Git deployment gates were restored to `deploymentEnabled=false` after the controlled production build.

Direct HTTP responses from the Render `/health/live`, `/health/ready` and `/version` endpoints were not captured by the available release tooling, so they are not represented as passed evidence here. Render's live deployment state, clean startup and deployment-window logs are the available API runtime evidence.

## Remaining authenticated observation — issue #192

The following checks require a real authenticated Auth0 browser/session and remain open:

1. Brand → Avatar loads for the intended Brand.
2. Presenter create/update preserves exact-version behavior.
3. With no Avatar provider configured, runtime eligibility remains `provider-unavailable` and no Presenter selector appears in creation.
4. A forged or non-eligible Presenter ID is rejected before durable creation begins.
5. Existing creation with `None` remains unchanged.
6. Cross-Brand Presenter read/write/selection remains denied.
7. Desktop/mobile Avatar UI matches `product/DESIGN.md`.

These checks are tracked in GitHub issue #192. VS-90 must remain `observed`, not `validated`, until they pass.

## Rollback boundary

RB-008 is ready. Migration 0029 is additive; do not delete Presenter rows or reverse the migration as the default rollback mechanism. Prefer forward recovery and restore the previous known-good API/web runtime for the affected component while preserving Brand, Presenter, content, publishing and audit state. Existing publishing, approval and channel safeguards remain unchanged.
