# VS-27 Hermes Runtime Integration — Implementation Review

## Review verdict before final exact-SHA gates

Implementation is scope-complete and ready for deterministic certification gates. This review does not certify, merge, release, deploy, enter secrets or enable production traffic.

## Architecture compliance

The implementation activates the approved TRD boundary:

```text
Kairo AgentRuntimePort
        |
        v
HermesBridgeRuntime  ----> DirectModelRuntime remains viable fallback
        |
        v
Kairo Hermes Runtime
        |-- Groq primary
        `-- OpenRouter bounded fallback
```

Hermes remains outside authoritative Kairo domain state. Kairo remains authoritative for Workspace/Brand isolation, approved context, Claim/Truth policy, schema validation, budgets, approval and deterministic publishing.

## Upstream provenance

Hermes Agent is pinned rather than floating:

- repository: `NousResearch/hermes-agent`
- version/tag: `0.18.2` / `v2026.7.7.2`
- exact commit: `9de9c25f620ff7f1ce0fd5457d596052d5159596`

CI builds the real service container from this exact dependency and verifies the installed version plus Kairo's zero-tool startup guard without provider credentials or model inference.

## Security review

### Provider-secret isolation

Provider keys are consumed only by the Hermes service configuration:

- `GROQ_API_KEY`
- `OPENROUTER_API_KEY`

Kairo API reads only:

- `KAIRO_HERMES_ENDPOINT`
- `KAIRO_HERMES_SERVICE_TOKEN`

The Kairo↔Hermes service token is separate from both provider keys. Tests verify that transport/provider secrets are not copied into the model-visible request body.

### Zero-tool and authority boundary

The bridge always sends `enabledTools: []` and the exact Kairo policy fingerprint. The Hermes service independently rejects a non-empty requested tool set or wrong fingerprint before provider execution.

The wrapper resolves the pinned Hermes tool registry with `enabled_toolsets=[]` at startup and refuses readiness if any tool remains visible. Every fresh `AIAgent` is also checked for a non-empty `tools` or `valid_tool_names` surface before model execution.

### Ambient Hermes state isolation

The wrapper forcibly sets `HERMES_HOME=/tmp/kairo-hermes` and removes project-plugin/profile/kanban opt-ins before startup and every invocation. It does not accept an ambient user Hermes home.

Kairo invocations use:

- `skip_context_files=True`;
- `load_soul_identity=False`;
- `skip_memory=True`;
- no trajectories;
- no checkpoints;
- no session-id propagation;
- one bounded Hermes iteration.

The wrapper also sets the pinned runtime's persistence guard before `run_conversation`.

### No persistent Hermes prompt logs

Pinned Hermes normally configures file logging even in quiet mode. The Kairo wrapper resets and replaces that file-logging setup before agent construction and fails if rotating Hermes file handlers become visible. Uvicorn access logging is disabled in the service container. Operational Kairo telemetry remains metadata-oriented and separate from Hermes prompt persistence.

### Provider privacy

OpenRouter fallback carries per-request provider routing that requires:

- Zero Data Retention;
- data collection denied;
- required request parameters supported.

If no eligible endpoint exists, fallback fails instead of weakening the policy.

Groq Zero Data Retention is an explicit deployment precondition because it is controlled through Groq Data Controls rather than a reliably attestable per-request switch in this adapter.

### Failure and fallback behavior

Normal `resilient` mode may try OpenRouter only after an eligible primary capacity/transport failure such as 429, provider 5xx, timeout or connection/network failure. Invalid requests, policy failures, schema failures and other non-eligible failures do not silently switch provider.

Controlled Marketing Lab evidence uses `primary-only`, which never attempts the fallback. This prevents baseline/challenger pairs from silently executing on different providers/models.

### Budget and provenance

Successful results require provider-reported input/output token counts. Kairo-owned configured pricing snapshots produce `costUsd`; missing usage fails closed. Results include provider, model, tokens, pricing version, measured cost, latency and pinned Hermes runtime version. A measured cost above the Kairo invocation budget is rejected.

Kairo's outer bridge enforces the invocation timeout and the wrapper also propagates that ceiling to the underlying OpenAI-compatible provider request.

## TDD and preserved failures

1. RED TypeScript contracts were committed before bridge routing implementation.
2. RED Python service contracts were committed before service core/provider implementation.
3. First full CI attempt exposed only implicit-`any` TypeScript parameters in the new API validator map; Python service contracts, migration verification, dependency audit and preflight had passed. The strict typing defect was fixed without weakening a gate.
4. Subsequent review added real pinned-container verification, OpenRouter ZDR/no-collection routing, Hermes file-log suppression, provider timeout propagation and forced ambient-profile isolation before requesting certification.

Failed/superseded attempts remain part of the PR history and are not rewritten as success.

## Deterministic verification required on final candidate

The final unchanged candidate must pass:

- Product Intake;
- Security baseline;
- offline Python fake-provider contract tests;
- Python compile verification;
- exact pinned Hermes container build;
- installed Hermes version check (`0.18.2`);
- real zero-tool startup guard against the installed pinned package;
- clean PostgreSQL 18 migrations;
- production dependency audit;
- repository preflight/governance validation;
- all TypeScript workspace typechecks/tests/builds;
- dashboard build;
- no unresolved PR review threads.

## Explicitly unproven / deferred

The implementation does **not** claim:

- that either provider key works;
- that Groq or OpenRouter has completed a real Kairo invocation;
- that a selected free model is currently available or rate-limit-free;
- that Groq ZDR is enabled on the user's account;
- that the Hermes service is deployed;
- that Kairo API is connected to a deployed Hermes endpoint;
- that VS-23 Native-vs-Corey qualification evidence has run.

Those require separate deployment/environment approval, private secret configuration and a subsequent governed synthetic smoke/evidence run.

## Release boundary

No merge, release, deployment, provider-secret entry or production enablement is authorized by this review. Exact-SHA certification and merge remain explicit human gates.
