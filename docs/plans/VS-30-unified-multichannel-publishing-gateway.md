# VS-30 Implementation Plan — Unified Multi-channel Publishing Gateway

## Intent

Promote Kairo's existing provider-neutral publishing primitives into one application-level Campaign distribution gateway without replacing existing domain commands, workers, adapter contracts or the encrypted credential boundary.

## Architectural decision

Do **not** create a provider-specific orchestration pipeline and do **not** create a second source of truth for publication state.

The gateway validates and fans out one authenticated user distribution action into existing per-destination `PublishCommand` records. Each selected destination uses the appropriate channel-specific Content Asset/Version, has its own explicit approval and continues through the existing deterministic worker/adapter/reconciliation path.

## Implemented work order

### 1. Characterise current publishing surface
- Existing Instagram, LinkedIn and manual command behaviour retained.
- Existing credential-reference, account-scope and publish-attempt idempotency boundaries retained.

### 2. Evolve destination approval persistence
- Multiple `ContentApproval` rows are permitted for the same reviewed version when destinations differ.
- Approval remains unique/idempotent per version + channel + accountRef.
- Existing `PublishCommand.approvalId` remains explicit and unique.
- Migration `0017_multichannel_approvals.sql` derives indexed destination columns from the existing JSON destination and keeps legacy JSON-only inserts compatible through a synchronising trigger.

### 3. Destination-neutral request/result contracts

```text
DistributionRequest
- campaignId (route)
- scheduledFor
- destinations[]
  - assetId
  - expectedVersion
  - channelAccountId
  - contentType
  - mediaItems/options

DistributionResult
- campaignId
- scheduledFor
- destinations[]
  - assetId
  - channelAccountId
  - safe channel/accountRef
  - commandId when created
  - scheduled | manual-required | unsupported | reconnect-required | rejected
  - safe reason when applicable
```

Contracts never carry provider credentials.

### 4. PublishingGateway
For each requested destination:
1. load the channel account inside Workspace + Brand scope;
2. reject/describe reconnect-required or disabled accounts independently;
3. verify channel content capability before provider execution;
4. invoke the existing human approval service for the selected destination and exact current asset version;
5. create or reuse the destination command through the existing `PublishingService`;
6. persist and return that destination independently.

Partial failure is intentional.

### 5. Idempotent fan-out
- `PublishingService.schedule()` looks up an existing command by destination approval before creating a new command.
- Replaying the same Campaign distribution action returns the same effective command IDs rather than creating duplicate publication commands.
- Existing publish-attempt idempotency/reconciliation remains unchanged.

### 6. API integration
Additive endpoint:

```text
POST /api/v1/brands/:brandId/campaigns/:campaignId/distributions
```

The existing single-asset `.../schedule` endpoint remains available for compatibility.

### 7. Worker alignment
- `PublishingJobRunner` and deterministic provider adapter execution remain unchanged.
- VS-29 Instagram production executor remains Instagram-only.
- LinkedIn is not production-enabled by this slice.

### 8. Deterministic verification
Covered cases include:
1. one reviewed version can hold separate destination approvals;
2. duplicate approval for the same destination is idempotent;
3. Campaign fan-out across an Instagram asset and LinkedIn asset produces isolated commands;
4. valid Instagram + reconnect-required LinkedIn yields partial success;
5. duplicate Campaign distribution retry reuses command IDs;
6. account/capability/current-version failures are deterministic and destination-local;
7. gateway/API results contain no credential refs or plaintext secrets;
8. legacy approval inserts continue working after migration;
9. review status excludes stale-version approvals;
10. existing single-destination and provider execution paths remain intact.

## Compatibility rule

Existing `PublishCommand`, `PublishAttempt`, `PublishedPost`, adapter and credential-vault contracts remain authoritative. The new gateway is an additive application use case.

## Security rule

The gateway may know channel-account metadata and credential **references only through the existing account entity**; distribution responses never return credential refs. Plaintext provider credentials remain resolvable only by deterministic adapter infrastructure immediately before provider execution.

## Rollout rule

Implement and certify the gateway without automatically enabling a new provider in production. Channel production enablement remains a separate exact-SHA governed decision.
