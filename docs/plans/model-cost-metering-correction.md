# Model cost metering correction

## Authority

- Approved TRD Model Gateway policy requires every model invocation to record provider, model/version, settings, token usage, cost and safety result.
- VS-23 shadow qualification issue #58 requires defensible measured cost; missing cost must not be treated as zero.
- Human scope/implementation direction: after PR #61 was merged, the owner explicitly said `Go next` to the stated next action: implement the small provider-neutral model cost-metering correction and then run the shadow comparisons.

## Scope

Implement only the provider-neutral model-cost correction at the Model Gateway boundary:

1. require an explicit configured token-pricing snapshot when the OpenAI-compatible runtime is configured;
2. calculate `costUsd` from provider-reported input/output token usage and configured rates;
3. reject incomplete/invalid token usage rather than undercounting it as zero;
4. preserve provider/model/token/latency metadata and secret isolation;
5. keep pricing provider-neutral and configuration-driven; do not hard-code current vendor prices;
6. test configuration parsing, cost calculation, zero-token handling, missing usage and invalid-pricing fail-closed behaviour.

## Non-goals / guardrails

- no database migration;
- no API or web UX change;
- no provider selection change;
- no hard-coded vendor pricing;
- no secrets committed;
- no VS-23 live activation or VS-24 promotion;
- no release/deployment authorization;
- VS-26 remains intentionally unreleased / pending its separate certification state.

## Configuration contract

When `KAIRO_LLM_PROVIDER`, `KAIRO_LLM_BASE_URL`, `KAIRO_LLM_MODEL` and `KAIRO_LLM_API_KEY` are configured, the runtime also requires:

- `KAIRO_LLM_INPUT_USD_PER_1M_TOKENS`
- `KAIRO_LLM_OUTPUT_USD_PER_1M_TOKENS`
- `KAIRO_LLM_PRICING_VERSION`

`KAIRO_LLM_PRICING_VERSION` is a non-secret operator-owned label identifying the pricing snapshot used for audit/reproduction, such as a provider pricing effective date or internal pricing-table revision.