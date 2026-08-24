# VS-90 architecture decision proposal — Avatar / Presenter boundary

Decision status: proposed. Tracking issue: #188.

## Question

How should Kairo persist and execute optional Brand Avatar / Presenter functionality without coupling domain state, tenancy, credentials or publishing authority to one media provider?

## Option A — Kairo-owned Presenter state + replaceable AvatarProvider (recommended)

- PostgreSQL stores authoritative Brand-scoped Presenter profile/version/readiness state.
- Private object storage stores visual/audio references and generated presenter media.
- Application/worker code calls a server-side `AvatarProvider` port.
- Provider adapters own transport only; credentials/endpoints stay server-side.
- Presenter records store non-secret provider binding/version identifiers only.
- Provider health is a capability projection, not authoritative Brand truth.
- Creation eligibility fails closed unless the saved Presenter and configured provider are both healthy.
- Generated presenter media becomes normal Content/Asset Version lineage before Preview/approval.
- Publisher remains deterministic and receives only the exact approved final asset.

### Benefits

- Directly follows the TRD dependency rules and provider-neutral architecture.
- Preserves Brand/Workspace isolation and private-media policy.
- Supports MuseTalk or another custom/self-hosted endpoint later without domain rewrite.
- Does not require the future AI & Media Providers Settings UI to exist first.
- Avoids fake readiness when no provider is configured.

### Costs

- Requires explicit Presenter persistence, API contracts, provider health projection and media job lineage.
- Real generation remains unavailable until at least one provider endpoint is configured.

## Option B — Provider-owned Presenter profile

Kairo stores only a provider presenter/avatar ID and reads most state from the provider.

Rejected recommendation because it makes provider availability authoritative over Brand state, weakens portability/versioning and complicates exact approved-asset lineage.

## Option C — Frontend-only Presenter preferences until provider work arrives

Store or simulate Presenter preferences in the web layer without a complete server/provider contract.

Rejected recommendation because it creates fake product state, cannot enforce tenancy or immutable approval lineage, and conflicts with PostgreSQL-as-system-of-record.

## Recommended decision

Adopt **Option A**.

## Consequences

1. Add Presenter contracts/domain records and a migration in the activated runtime slice.
2. Add an `AvatarProvider` capability port and test-only fake implementation.
3. First production-capable adapter may target a configured custom/self-hosted endpoint; no provider is hard-coded into product policy.
4. AI & Media Providers Settings remains a later slice; VS-90 consumes server-side configured provider capability only.
5. Presenter selector remains absent unless provider eligibility is true; `None` remains the default.
6. Approval/publishing semantics remain unchanged: edits or regeneration after lock create a new version and require reapproval.

## Existing authority alignment

- PRD FR-03: Brand-configurable Brand knowledge/settings.
- PRD FR-11: rendered media and immutable Content → Asset → Asset Version lineage.
- PRD FR-13: human approval of exact versions.
- TRD: PostgreSQL system of record, private S3-compatible media, provider-specific code behind ports/adapters, agents cannot persist authoritative state, deterministic publishing.
- Design approvals: Avatar/Presenter optional under Brand; Presenter selector only when eligible; default None; provider binding retained.

No autonomous publication or new primary navigation is introduced by this decision.