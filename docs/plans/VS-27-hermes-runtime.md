# VS-27 Hermes Runtime Integration Plan

## Scope lock
Implement only the approved `docs/slices/VS-27.md` runtime boundary. No deployment, secret entry, release, production enablement, database migration, VS-23 activation or VS-24 promotion.

## Existing seams to reuse
- `apps/worker/src/agent-runtime.ts` — `AgentRuntimePort`, `HermesBridgeRuntime`, `AgentRuntimeRouter`, `DirectModelRuntime`.
- `apps/worker/src/model-gateway.ts` — provider-neutral direct fallback.
- `apps/api/src/operations-runtime.ts` — Kairo-owned cost/failure telemetry.
- `apps/api/src/server.ts` — runtime composition root.

## Upstream pin
`NousResearch/hermes-agent@9de9c25f620ff7f1ce0fd5457d596052d5159596` (`v2026.7.7.2`, v0.18.2).

## Implementation steps
1. RED: extend `HermesBridgeRuntime` tests for `routingMode`, service metadata and fail-closed provenance.
2. GREEN: add `routingMode: resilient | primary-only` to the Kairo/Hermes request contract without exposing capabilities or secrets.
3. RED: add isolated tests for the Hermes service core: bearer auth, fingerprint, zero tools, JSON output, primary/fallback selection, primary-only behavior, token/cost accounting and secret redaction.
4. GREEN: implement `services/hermes-runtime/` as a small Python/FastAPI adapter around the pinned Hermes Agent library.
5. Startup guard: resolve Hermes' tool definitions with an explicit empty toolset and refuse readiness if any tool is visible. Instantiate Kairo calls with toolsets empty, memory/context/skills disabled and one bounded reasoning turn.
6. Provider execution: Groq primary; OpenRouter fallback only in resilient mode. Provider/model/rates are explicit environment configuration. Do not hard-code secret values.
7. Kairo composition: `KAIRO_HERMES_ENDPOINT` + `KAIRO_HERMES_SERVICE_TOKEN` activates Hermes. If direct `KAIRO_LLM_*` is also configured, preserve `AgentRuntimeRouter(Hermes, Direct)`; if only one runtime is configured, use that runtime; if neither exists, AI features degrade exactly as they do today.
8. Document service env names and local/deployment health checks.
9. Run repository CI/security gates. Fix only slice-scoped failures.
10. Freeze exact candidate SHA and stop for human certification/merge approval.

## Hermes service configuration contract
Secrets — configure only on the Hermes service:
- `KAIRO_HERMES_SERVICE_TOKEN`
- `GROQ_API_KEY`
- `OPENROUTER_API_KEY`

Non-secret/runtime policy:
- `HERMES_PRIMARY_PROVIDER=groq`
- `HERMES_PRIMARY_BASE_URL=https://api.groq.com/openai/v1`
- `HERMES_PRIMARY_MODEL=openai/gpt-oss-120b`
- `HERMES_PRIMARY_INPUT_USD_PER_1M_TOKENS`
- `HERMES_PRIMARY_OUTPUT_USD_PER_1M_TOKENS`
- `HERMES_PRIMARY_PRICING_VERSION`
- `HERMES_FALLBACK_PROVIDER=openrouter`
- `HERMES_FALLBACK_BASE_URL=https://openrouter.ai/api/v1`
- `HERMES_FALLBACK_MODEL` (explicit pinned model; never `openrouter/free` for controlled evidence)
- `HERMES_FALLBACK_INPUT_USD_PER_1M_TOKENS`
- `HERMES_FALLBACK_OUTPUT_USD_PER_1M_TOKENS`
- `HERMES_FALLBACK_PRICING_VERSION`

Kairo API receives only:
- `KAIRO_HERMES_ENDPOINT`
- `KAIRO_HERMES_SERVICE_TOKEN`

## Failure semantics
- Authentication/policy/tool attestation failure: no provider call.
- Primary provider capacity/transport failure in resilient mode: one fallback attempt.
- Primary-only: no fallback under any condition.
- Provider output not parseable as a JSON object: fail.
- Missing token usage: fail because Kairo qualification/cost evidence must be auditable.
- Missing pricing configuration: fail at service startup.
- Budget estimate exceeding request `maxCostUsd`: fail before returning successful evidence.

## Verification
- Python unit tests for service core.
- TypeScript runtime tests for bridge routing contract.
- `npm run preflight`.
- `npm run runtime:verify`.
- security baseline.
- no unresolved PR threads.

## Human gates
Implementation authorization is recorded from the owner's explicit Hermes selection + `Go`. Certification, merge, release, deployment, provider-secret entry and production enablement remain separate human gates.
