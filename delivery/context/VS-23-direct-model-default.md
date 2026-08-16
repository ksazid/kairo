# VS-23 DirectModelRuntime default correction

## Owner decision

On 2026-08-17, the product owner explicitly directed Kairo to keep Hermes integrated but flagged off by default and use Kairo's own `DirectModelRuntime` as the active runtime path. Hermes is retained for future evaluation and may be re-enabled only through an explicit configuration flag.

## Corrective boundary

- Add `KAIRO_HERMES_RUNTIME_ENABLED` as an explicit Hermes opt-in gate.
- Hermes remains disabled unless the flag value is exactly `1`.
- Existing `KAIRO_HERMES_ENDPOINT` and `KAIRO_HERMES_SERVICE_TOKEN` values may remain configured while dormant and must not activate Hermes by themselves.
- When Hermes is disabled, the existing API composition selects `DirectModelRuntime` through the Kairo-owned model gateway.
- When Hermes is explicitly enabled, endpoint and service token remain required together and all existing Hermes policy, zero-tool, schema-validation and routing protections remain unchanged.
- Do not delete the Hermes service, bridge adapter, provider configuration, policy fingerprint, tests, or future benchmark capability.
- Do not alter model-provider credentials, pricing policy, subscription policy, publishing authority, Brand data, or production database state as part of this correction.

## Regression evidence required

- No Hermes configuration returns no Hermes runtime.
- Configured Hermes endpoint/token remain dormant when the opt-in flag is absent or `0`.
- Explicit `KAIRO_HERMES_RUNTIME_ENABLED=1` requires complete Hermes bridge configuration.
- Explicitly enabled Hermes still constructs the existing `HermesBridgeRuntime` without requiring provider credentials inside Kairo.
- Existing DirectModelRuntime, router fallback, zero-tool policy attestation and output validation tests remain green.

## Release control

This correction does not authorize merge, deployment, production configuration mutation, another Corey-vs-Native benchmark run, or production enablement. Certification and any production change remain separate exact-SHA human gates under repository governance.
