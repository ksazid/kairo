# VS-29 Implementation Plan — Instagram Production Publishing Activation

## Authority

- `AGENTS.md`
- `product/PRD.md` / `product/TRD.md`
- `docs/slices/VS-15.md`
- `docs/slices/VS-29.md`
- Existing publishing, Instagram OAuth, encrypted credential and execution-store contracts

## Bounded implementation

1. Add tests for publishing-worker configuration bounds and provider/secret prerequisites.
2. Add an optional channel filter to `PgPublishingExecutionStore`, defaulting to current all-channel behavior for compatibility.
3. Add a publishing-worker configuration module and dedicated process entrypoint.
4. Compose the entrypoint from existing `PublishingJobRunner`, `DeterministicPublishingWorker`, `InstagramProfessionalAdapter`, `PgPublishingExecutionStore`, and `PgEncryptedChannelCredentialVault`.
5. Restrict the production entrypoint to `instagram` claims.
6. Add `start:publisher` and include the publisher bundle in the normal API build.
7. Add `Dockerfile.publisher` for an independently deployable Render background worker.
8. Run exact-branch review, Product Intake, Security, CI, governance/preflight and runtime verification.

## Safety invariants

- No plaintext channel token in logs, environment-derived diagnostics, domain state or publish metadata.
- No readiness credential copying.
- No new OAuth implementation; existing connection routes remain authoritative.
- No implicit publication on API startup.
- No production service mutation during implementation/certification.
- No auto-retry of unknown publication outcomes.
- No non-Instagram command may be claimed by the production Instagram publisher.
- No merge/deployment without a separate exact-SHA human gate.

## Verification

- Unit tests for configuration.
- Existing VS-15 publishing adapter and PostgreSQL hydration tests.
- Runtime typecheck/test/build.
- Governance and preflight.
- PR Product Intake, Security baseline and CI on the exact candidate SHA.
