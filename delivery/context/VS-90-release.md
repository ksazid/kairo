# VS-90 release preparation

Status: release authorized; production enable pending.

Certified runtime SHA: `1da4665fa430468516f79e38984638369552b6e7`
Merge commit: `6598d7898551a9518ef2e807f77e2fed4e9ee2e7`

## Release intent

Prepare the certified VS-90 Brand Avatar / Optional Presenter foundation for a separately authorized production rollout. This preparation does not enable or deploy production.

## Planned release record

Proposed release ID: `REL-008`.

- Slice: VS-90
- Risk: medium
- Runtime: web + API
- Migration: `apps/api/migrations/0029_brand_presenters.sql`
- Provider configuration: none
- Avatar rendering: unavailable/fail-closed until a governed provider adapter is configured
- Publishing/approval/channel behavior: unchanged

## Planned rollback record

Proposed rollback ID: `RB-008`.

The migration is additive. If the rollout fails, prefer forward recovery and redeploy the last known-good production web/API runtime. Do not delete Presenter rows or existing Brand/content/channel state as a rollback mechanism.

Rollback triggers include:

- migration 0029 fails or API readiness does not recover;
- authenticated Brand → Avatar cannot load or violates Brand scoping;
- a provider-unavailable Presenter becomes selectable;
- existing simple creation without a Presenter regresses;
- cross-Brand Presenter access succeeds;
- existing publishing, approval or channel behavior regresses;
- production health/version provenance fails.

## Required production smoke after production-enable

1. Apply migration 0029 successfully to the production database.
2. API `/health/live`, `/health/ready` and version provenance pass.
3. Authenticated Brand → Avatar loads for the intended Brand.
4. With no Avatar provider configured, runtime eligibility is `provider-unavailable` and no Presenter selector is offered during creation.
5. A forged/non-eligible Presenter ID is rejected before durable creation begins.
6. Existing creation with `None` behaves unchanged.
7. Cross-Brand Presenter read/write/selection remains denied.
8. Existing Content → Preview → Approve & Lock → publish/schedule safeguards remain unchanged.
9. Web production route `/brands/{brandId}/avatar` renders without runtime errors on desktop/mobile.
10. If any required smoke fails, stop rollout and execute RB-008 recovery.

## Authorization boundary

Product Owner release approval was given at `2026-08-24T23:02:00+02:00` for exact SHA `1da4665fa430468516f79e38984638369552b6e7`.

Production-enable remains pending. No Render/Vercel deploy, migration execution, provider secret change or production traffic change is authorized by this release preparation.
