# VS-23 prerequisite — Corey vs Kairo on DirectModelRuntime

## Owner direction

On 2026-08-17, after the production DirectModelRuntime provider diagnostic succeeded, the product owner directed Kairo to proceed so Corey and Kairo can be tested next.

This records bounded implementation/preparation approval only. It does not authorize merge, release, deployment, or benchmark execution.

Base production/main SHA: `f777a58f93d57b4b7dc713676873082e73f77f43`.

## Purpose

Move the existing VS-23 paired Corey-vs-Kairo qualification evidence path off Hermes and onto Kairo's own `DirectModelRuntime`, using the same Kairo-owned `ModelGateway` configuration for both lanes.

## Invariants preserved

- Exactly four approved synthetic motorcycle carousel cases:
  - `motorcycle-carousel-01`
  - `motorcycle-carousel-02`
  - `motorcycle-carousel-03`
  - `motorcycle-carousel-04`
- Kairo baseline remains `kairo-native-carousel@1`.
- Corey challenger remains `corey-social-shadow@2.2.0+7868cb9`.
- Corey source remains pinned to commit `7868cb9251fad80a73d26e488a5ad5f6c4a9f335`, path `skills/social/SKILL.md`, with Git blob verification before any model lane.
- Both native and Corey lanes must use the same DirectModel provider/model/pricing route.
- Eight sequential model lanes remain paced by exactly 65 seconds between invocations.
- Per-lane limits remain: 2,200 max output tokens, zero tool calls, $0.03 max declared cost, 30-second timeout.
- Existing Claims lineage, prohibited-pattern checks, schema validation, durable run claiming, bounded failure persistence, and no-retry semantics remain unchanged.
- Evidence remains synthetic-only; no customer or private production Brand data is used.
- No tools, credentials, social-channel authority, publishing, or external action is granted to either lane.

## Runtime change

- Benchmark startup composition passes `DirectModelRuntime` to the evidence orchestrator instead of `HermesBridgeRuntime`.
- Evidence provenance now requires `metadata.runtime === "direct-model"` plus provider, model, and pricing version.
- The benchmark no longer waits for Hermes readiness.
- Hermes integration and its readiness utility remain in the repository, dormant and separately opt-in via `KAIRO_HERMES_RUNTIME_ENABLED=1`.
- Production Hermes remains disabled by default.

## Explicit exclusions

- No provider, model, key, or pricing configuration change.
- No benchmark execution in this implementation PR.
- No new benchmark cases, prompts, scoring rules, budgets, pacing, or retry behavior.
- No database migration.
- No production data mutation beyond a separately approved future evidence run.
- No autonomous merge, release, deployment, or production enablement.

## Required gates

1. Product Intake, Security, and CI/preflight must pass on the exact candidate SHA.
2. Certification and merge require explicit human approval bound to that exact candidate SHA.
3. The benchmark-capable merged SHA must then pass post-merge certification before release/deployment.
4. Production deployment remains a separate exact-SHA approval.
5. One Corey-vs-Kairo benchmark attempt requires a separate exact-SHA + unique-run-ID benchmark authorization.
6. The benchmark flag must return to `0` immediately after that one approved attempt, whether successful or failed.
