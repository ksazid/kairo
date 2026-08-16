# VS-23 prerequisite — DirectModelRuntime provider diagnostic

## Owner approval

On 2026-08-17 the product owner directed Kairo to proceed to the next validation step after production cutover to `DirectModelRuntime`. The immediately stated remaining validation was one real Groq-backed DirectModelRuntime invocation to prove the production provider key/model route, so the owner's `Go next` is recorded as bounded scope + implementation approval for this diagnostic only.

Base production/main SHA at approval: `6c24517d9d5dad9815be97539318cfc90fc31aad`.

## Scope

- Add a default-off `KAIRO_DIRECT_MODEL_PROVIDER_DIAGNOSTIC_RUN=1` startup diagnostic.
- Execute exactly one synthetic, global-public `judge` invocation per started diagnostic process.
- Invoke `DirectModelRuntime` directly through the same Kairo-owned `ModelGateway` configured by `KAIRO_LLM_*`.
- Use no Brand/Workspace data, no private context, no tools, no social credentials, no publishing authority and no customer mutation.
- Request only `{ "ok": true }` using the dedicated `direct-model-diagnostic@1` validator.
- Limit the request to 128 output tokens, zero tool calls, a $0.01 declared cost ceiling and a 30-second invocation budget.
- Log only safe runtime/provider/model/token/cost/pricing/latency metadata; never log model output, prompts or credentials.
- Keep the normal Kairo DirectModelRuntime policy/validator set unchanged by using a dedicated diagnostic DirectModelRuntime instance over the same gateway.
- Keep Hermes disabled and keep the Corey-vs-Native benchmark disabled throughout any later production diagnostic execution.
- Immediately return the diagnostic flag to `0` after a successful or failed approved production attempt.

## Explicit exclusions

- No benchmark execution or benchmark authorization.
- No Hermes activation.
- No provider/model/key/pricing change.
- No database migration or production-data mutation.
- No authenticated customer workflow used as a test fixture.
- No publishing or external channel action.
- No autonomous merge, release, production deployment or production diagnostic execution.

## Required evidence before merge

- Unit test proves the flag is exact opt-in.
- Unit test proves the diagnostic request is synthetic/global-public with no capabilities/tools and a bounded budget.
- Unit test proves safe metadata is returned without model output.
- Unit test fails closed if execution metadata does not identify `direct-model`.
- Repository Product Intake, Security and CI/preflight gates must pass on the exact candidate SHA.

## Release control

Certification/merge requires a new exact-SHA human approval. Production deployment and enabling the one-shot diagnostic remain separate exact-SHA production gates under `AGENTS.md`.
