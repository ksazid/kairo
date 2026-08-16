# VS-23 prerequisite — Hermes readiness and database-target correction

## Purpose

Correct two operational defects discovered during the approved Corey-vs-Native qualification attempt without changing benchmark semantics or activating VS-23.

## Observed production evidence — 2026-08-16

- Kairo API was running the approved `1bb6543d…` release.
- Authorized run ID `vs23-corey-native-20260816-45469037c4e3` was durably claimed and failed on the first Kairo Native lane with `Hermes bridge returned 502` before any Corey lane or paired evidence completed.
- Render logs show `kairo-hermes-runtime` had shut down while idle before the run. No Hermes application request log was emitted for the failed invocation, while Kairo failed in under two seconds after startup. This is consistent with the first model request reaching the sleeping service before it was application-ready.
- A queued Kairo deployment carrying run ID `vs23-qualification-20260816-2322` then started separately and failed the same way. Both run IDs remain failed and must never be reused.
- Neon default branch `production` (`br-broad-dew-asjbqglh`) has migration `0016_marketing_shadow_evidence_runs.sql` registered and currently has zero evidence rows.
- Neon readiness branch `kairo-rel001-readiness` (`br-ancient-night-asshss8d`) contains the two failed evidence rows above. The live Kairo API therefore used the readiness branch during these attempts instead of the intended production branch.

## Bounded code correction

- Reuse Hermes' existing unauthenticated `/health/ready` endpoint before the first qualification model lane.
- Probe readiness only after the pinned Corey source has been fetched and its Git blob hash verified.
- Retry transient cold-start responses within a bounded window.
- Never send the Hermes bearer token or model-visible data to the readiness endpoint.
- Keep readiness/cold-start time outside measured lane latency.
- If Hermes never becomes ready, fail closed before `/kairo/v1/invoke` is called.

## Separately gated deployment configuration correction

Before another qualification attempt, the production Kairo API `DATABASE_URL` must target Neon branch `production` / database `kairo`, not `kairo-rel001-readiness`. This is a production environment mutation and is not performed by this corrective PR.

The next evidence enablement must also:

1. start with `KAIRO_MARKETING_SHADOW_EVIDENCE_RUN=0`;
2. verify no stale/queued Kairo API environment deployment can start with an older run ID;
3. verify the live API is connected to the intended production database and migration 0016 is registered there;
4. use a new, never-before-used run ID bound to the exact certified release SHA;
5. enable the evidence flag exactly once after the certified deployment and Hermes readiness are confirmed;
6. immediately return the flag to `0` after completion or failure.

## Unchanged benchmark semantics

- exactly four approved motorcycle carousel cases and eight paired lanes;
- fixed 65-second inter-lane provider-window pacing;
- 30-second per-lane timeout;
- 2200 output-token ceiling and $0.03 cost ceiling;
- provider, model, routing and fallback policy;
- benchmark inputs, pinned Corey snapshot and concrete carousel output contract;
- Truth, quality, route, human-preference and edit-distance rules;
- zero tools, secrets, social credentials and publishing authority.

## Explicit exclusions

- No migration or schema change.
- No benchmark execution in this PR.
- No reuse of either failed run ID.
- No fabricated or partial qualification evidence.
- No Corey promotion, VS-23 activation, live evaluation or publishing authority.
- No merge, release, deployment or production environment mutation without the repository's separate exact-SHA human gates.
