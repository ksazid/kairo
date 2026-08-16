# VS-23 prerequisite evidence runner — bounded execution context

## Purpose

Close the remaining Issue #58 evidence gap by executing the already-prepared four-case motorcycle carousel qualification through the live Hermes reasoning boundary. This is prerequisite evidence only; it does not activate VS-23 or qualify Corey by itself.

## Approved execution boundary

- Execute exactly `motorcycle-carousel-01` through `motorcycle-carousel-04` from `evaluation/marketing-lab/benchmark-cases.json`.
- Run the Kairo Native `kairo-native-carousel@1` baseline and the pinned `corey-social-shadow@2.2.0+7868cb9` challenger on the identical transformed input for each case.
- Use Hermes directly for qualification evidence. Hermes may use its governed provider fallback, but the runner must fail closed unless all eight executions report the exact same Hermes runtime/provider/model/pricing route; provider fallback therefore cannot be silent or create a mixed-route comparison.
- Retrieve only the exact pinned public Corey skill source and verify its Git blob hash before supplying it as untrusted reference context.
- Give the challenger zero tool calls, no social/network capability, no secrets, no Instagram credentials and no publishing authority.
- Require measured cost and latency metadata for both lanes; missing evidence fails closed.
- Emit only synthetic benchmark outputs, source provenance, the explicit runtime route and safe runtime metadata to the application evidence log marker.
- The runner is default-off and starts only when `KAIRO_MARKETING_SHADOW_EVIDENCE_RUN=1` is explicitly configured for an approved evidence deployment.

## Runtime evidence observed on 2026-08-16

The certified primary-only runner at production SHA `63e887d01804ade01f4b77826ae311b2d32cb666` was attempted twice. Both attempts failed on the first Kairo Native invocation with `Hermes bridge returned 502`; no paired output, score, preference or winner evidence was produced. The one-shot flag was disabled after each failed attempt. The corrective runner permits Hermes' existing governed provider fallback only under the uniform-route invariant above.

The certified resilient runner at Kairo API SHA `8babc4ff680df40b23a17ebc8cfcdeb8f08cf763` was then deployed for the approved retry. The first Kairo Native invocation again returned `Hermes bridge returned 502` before any paired output was produced. A queued redeploy of the same approved SHA reached the same fail-closed result before the flag-off deployment completed. `KAIRO_MARKETING_SHADOW_EVIDENCE_RUN` is now disabled. No output, human score or winner evidence was claimed from either failed invocation.

The Hermes service had never completed a real provider-backed Kairo invocation before these attempts; prior certification used fake-provider contracts and zero-tool container verification. Metadata-only diagnostics were then certified and deployed to `kairo-hermes-runtime` at exact SHA `695ac433353db7fa5b56f654a3c5a34b4134449a`. The service became live and healthy. The startup `INFO` marker was filtered by the service logging configuration, and with the benchmark evidence flag intentionally off there was no provider-backed request from which to collect the new warning-level failure category.

A Hermes-local, default-off, one-shot synthetic provider self-test was then certified and deployed at exact SHA `9c0d795aa2eca8f66d5aa78d757716d94881ab59`. `KAIRO_HERMES_PROVIDER_DIAGNOSTIC_RUN=1` was enabled only for that approved diagnostic deployment while the benchmark evidence flag remained off. The safe route marker confirmed the primary route as Groq `openai/gpt-oss-120b` with pricing version `groq-free-2026-08-16`; the fallback remained OpenRouter `openai/gpt-oss-120b:free`. The synthetic invocation reached and authenticated to Groq, but the provider returned HTTP 400 because the route rejected Hermes' forced `response_format=json_object` generation. The diagnostic flag was immediately returned to `0`, and the same approved SHA was redeployed live with the self-test disabled. No benchmark output or winner evidence was produced.

The corrective compatibility change removes provider-level forced JSON mode only for the Groq route. It does not alter the model, provider routing, fallback policy, privacy controls, tools, memory or publishing authority. Kairo's runtime continues to parse every provider response as a JSON object and fail closed on malformed output or missing usage/cost evidence, so JSON/schema enforcement remains inside the Kairo-owned boundary.

The Groq compatibility correction was merged and deployed to Hermes at exact SHA `87e16d550487e2aae07274784030d7e770b1aec4`. A post-fix synthetic verification reached Groq without the prior HTTP 400, confirming that the provider-level JSON-mode incompatibility was removed. The verifier then hit `finish_reason=length` because its own payload allowed only 32 output tokens and 10 seconds; Hermes' one-iteration upstream path requested continuation/summary, and Kairo correctly rejected the resulting non-JSON final response. No benchmark output or winner was produced. The diagnostic flag was returned to `0`. The corrective verifier change therefore aligns only the synthetic diagnostic budget with the existing marketing qualification ceiling: 2200 output tokens, $0.03 maximum measured cost and 30 seconds. It does not increase the benchmark's approved budget.

The representative verifier correction was merged and deployed at exact SHA `8548ac455970abde6a012ef19251778d51d57de0`. With the benchmark flag still off, the one-shot Hermes verification completed successfully on Groq `openai/gpt-oss-120b`, returned a valid JSON object, reported measured latency of 13404 ms and measured cost of approximately $0.00016455, and then the provider diagnostic flag was returned to `0` with a flag-off deployment confirmed live.

The separately approved four-case Kairo API evidence run was then started on exact SHA `8548ac455970abde6a012ef19251778d51d57de0`. It executed once and reached Hermes successfully, but the first Kairo Native case failed closed with `Hermes output failed Kairo schema validation`; no Corey lane, paired output, human score or winner evidence was produced. The evidence flag was returned to `0`, and the flag-off Kairo API deployment was confirmed live.

The schema-validation failure exposed a Kairo prompt-contract gap rather than a provider failure: Hermes was told only the output schema identifier `marketing-carousel-plan@1`, while the Kairo validator requires the concrete carousel shape and Claim-lineage fields. The corrective change therefore supplies the exact Kairo-owned `marketing-carousel-plan@1` output contract to the Hermes system prompt for that schema only. It does not relax or replace Kairo's existing validator, change provider/model/routing, alter benchmark inputs or budgets, grant tools/network/secrets/publishing authority, or expose production Brand or Instagram data. Unknown schemas continue without an invented contract and remain fail-closed at their existing Kairo validators.

The explicit carousel contract was merged and deployed to Hermes at exact SHA `293fb4a2ae224f65ce0b85464d19873a7fef8425`. A separately approved Kairo API benchmark retry on that same exact SHA progressed beyond the prior schema failure. During the sequential lane execution, Groq reported its `openai/gpt-oss-120b` on-demand token-per-minute limit of 8000 and returned HTTP 429 responses with retry windows of roughly 23 to 34 seconds. The pinned Hermes client correctly honored those retry windows, but a later Corey lane exceeded Kairo's unchanged 30-second per-invocation timeout and the run failed closed with `Hermes invocation timed out`. No complete paired evidence set, human score or winner was produced. The evidence flag was immediately returned to `0`, and the flag-off Kairo API deployment on the same SHA was confirmed live.

The provider-window correction is benchmark orchestration only: insert a fixed 65-second gap between sequential Hermes lanes so the eight approved executions do not self-throttle the observed one-minute Groq TPM window. The delay occurs outside each Hermes invocation, so it is not included in the measured provider/runtime latency used by the qualification thresholds. It does not change the 30-second lane timeout, 2200-token ceiling, $0.03 cost ceiling, model, provider routing, fallback policy, inputs, output contract, scoring, Truth rules, edit-distance rules, or exact-route invariant.

## Explicit exclusions

- No private production Brand context.
- No Instagram account data or Insights in this controlled round.
- No autonomous publication.
- No skill promotion, Brand selection, VS-23 activation or deterministic winner claim.
- No fabricated quality, preference or edit-distance evidence.

## Completion sequence

1. Certify an exact runner/runtime diagnostic SHA through CI, Security and Product Intake.
2. Obtain explicit exact-SHA deployment approval for the affected service.
3. Keep the benchmark evidence flag off while running the separately gated Hermes-local one-shot provider diagnostic and collecting only the safe route/failure marker.
4. Correct the confirmed provider/runtime compatibility cause, including keeping the synthetic verification ceiling representative of the already-approved benchmark ceiling, and separately certify/deploy each correction.
5. Ensure Hermes receives the concrete Kairo output contract required by the local validator without weakening schema or lineage enforcement.
6. Pace sequential qualification lanes outside their measured invocation windows when required by the provider's documented/observed TPM boundary.
7. Enable the one-shot benchmark evidence flag only for the approved Kairo API SHA, collect the paired execution log, then disable the flag.
8. Present the four pairs blind as A/B for human scoring.
9. Add truth/quality, preference and edit-distance evidence and derive the deterministic verdict from the existing qualification thresholds.
