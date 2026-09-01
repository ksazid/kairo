# Hunter Chunk 5 Freeze — Manual Now, Production Cron Later

## Approved boundary

- Hunter runs are manually triggered through `POST /api/v1/brands/:brandId/recommendations`.
- Every current run is persisted with `trigger = manual` and immutable Brand Intelligence Snapshot + Discovery Plan lineage.
- Brand activation returns `schedule: null` until a separately approved production scheduling slice is certified and enabled.
- No cron process, recurring task, schedule table, scheduler lease, production worker or production deployment is activated by this freeze.

## Frozen production architecture

When production scheduling is separately approved:

1. Keep Kairo-owned `hunter_schedules` as the Brand schedule source of truth.
2. Run one production-only dispatcher cron; never create one Graphile cron entry per Brand.
3. The dispatcher enqueues due per-Brand Hunter jobs through Graphile Worker.
4. Jobs carry immutable `brandId`, `scheduleId`, `snapshotVersion`, `planVersion` and `scheduledFor` lineage.
5. Use a stable execution identity `hunter:{brandId}:{scheduleId}:{scheduledFor}` in both Graphile `jobKey` and a Kairo database uniqueness constraint.
6. Re-run readiness, budget, Brand status and snapshot/plan validity gates immediately before execution.
7. Treat delivery as at-least-once; Hunter execution and persistence must remain idempotent.
8. Limit transient retries to 3–5 attempts. Validation, not-ready and budget rejections do not retry.
9. Kairo owns schedule policy, timezone calculation, budgets, execution identity and Run Records. Graphile owns queue durability, claiming, locking, retry mechanics, crash recovery and worker coordination.
10. Run the production worker separately from the API and keep Graphile's internal schema private to its adapter.

## Freeze acceptance

- Onboarding public URL evidence is sanitized through Flow 1A.
- Brand DNA, readiness, Brand Intelligence Snapshot and Discovery Plan are created.
- Manual Hunter execution consumes the exact snapshot and plan versions.
- The Hunter Run Record is terminal and has `trigger = manual`.
- Activation continues to expose `schedule: null`.
- A captured public-page certification result is emitted by `hunter-chunk5-public-url.live.test.ts`, allowing the real public content to be replayed deterministically when CI cannot resolve external DNS.
- Discover's `Refresh discovery` action invokes the manual Hunter endpoint, reloads persisted opportunities and renders the returned opportunity in the approved table/grid UI.

Production cron implementation, certification, release and enablement require a new explicit approval and exact-SHA gate.
