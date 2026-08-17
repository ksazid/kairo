# VS-30 Implementation Plan — Unified Multi-channel Publishing Gateway

## Intent

Promote Kairo's existing provider-neutral publishing primitives into one application-level distribution gateway without replacing the existing domain commands, workers, adapter contracts or encrypted credential boundary.

## Architectural decision

Do **not** create a provider-specific orchestration pipeline and do **not** create a second source of truth for publication state.

The gateway validates/fans out one user distribution action into existing per-destination `PublishCommand` records. Each automatic destination has its own explicit approval and continues through the existing deterministic worker/adapter/reconciliation path.

## Work order

### 1. Characterise current publishing surface
- Preserve existing Instagram, LinkedIn and manual behaviour in tests.
- Verify secret boundaries, account scoping and idempotency invariants.

### 2. Evolve destination approval persistence
- Permit multiple `ContentApproval` rows for the same reviewed content version when their destinations differ.
- Keep approvals idempotent per version + channel + accountRef.
- Do not weaken the requirement that every publish command references an explicit approval.

### 3. Add destination-neutral request/result contracts

```text
DistributionRequest
- campaignId / assetId / expectedVersion
- scheduledFor
- destinations[]
  - channelAccountId
  - contentType
  - mediaItems/options

DistributionResult
- destinations[]
  - channelAccountId
  - channel/accountRef when safe
  - commandId when created
  - scheduled | manual-required | unsupported | reconnect-required | rejected
  - safe reason/code
```

Contracts never carry provider credentials.

### 4. Implement PublishingGateway
For each requested destination:
1. load the account inside Workspace + Brand scope;
2. obtain the destination-bound approval for the current version;
3. validate capability/media shape through existing `createPublishCommand` rules;
4. create/persist one command independently;
5. return normalized destination state.

Partial failure is intentional.

### 5. Idempotent fan-out
- Repeated distribution requests must not create duplicate effective commands.
- Add repository lookup keyed by version + channel account + scheduled target where necessary.
- Preserve existing publish-attempt idempotency.

### 6. API integration
Add a versioned multi-destination endpoint while retaining current single-destination behaviour:

```text
POST /api/v1/brands/:brandId/publishing/distributions
```

### 7. Worker alignment
- Keep `PublishingJobRunner` and deterministic adapter execution unchanged unless a test-backed refactor is needed.
- VS-29 Instagram-only production executor remains Instagram-only.
- Do not production-enable LinkedIn in this slice.

### 8. Deterministic tests
Required cases:
1. one content version can store Instagram and LinkedIn approvals independently;
2. duplicate approval for the same destination is idempotent;
3. Instagram + LinkedIn fan-out creates two isolated commands;
4. valid Instagram + reconnect-required LinkedIn yields partial success;
5. manual destination remains manual-required;
6. duplicate distribution retry is idempotent;
7. cross-Brand account is rejected;
8. approval/current-version mismatch is rejected;
9. content type/capability mismatch fails before provider invocation;
10. no secret value appears in distribution result;
11. existing Instagram image/carousel/Reel and LinkedIn tests stay green;
12. unknown provider outcomes retain reconciliation semantics.

## Compatibility rule
Existing `PublishCommand`, `PublishAttempt`, `PublishedPost`, adapter and credential-vault contracts remain authoritative unless a test-backed reason requires narrow evolution.

## Security rule
The gateway may know credential **references**, never plaintext credentials. Only deterministic adapter infrastructure resolves secrets immediately before provider execution.

## Rollout rule
Implement and certify the gateway without automatically enabling any new provider in production. Channel production enablement remains a separate exact-SHA governed decision.
