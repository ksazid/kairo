# Kairo Page Schema Alignment Gate

**Status:** Approved governance gate
**Scope:** Kairo UI V2 (`apps/kairo-ui-v2`) and the current Kairo backend only.
**Legacy rule:** Legacy Kairo is never a schema or UI authority.

## Purpose

Every approved UI page must have one implementation contract that is proven to:

1. match the approved mockup exactly,
2. include every visible control, property, state and action,
3. reuse existing canonical schema/routes/models wherever they already exist,
4. avoid duplicate persistence and duplicate business concepts,
5. preserve lineage/provenance,
6. define unavailable/degraded/loading/error behaviour,
7. be approved before implementation.

## Mandatory order

For every page:

**Current V2 implementation audit -> approved mockup -> UI inventory -> existing backend/schema inventory -> reuse/extend/add matrix -> page read model -> write-action map -> state matrix -> lineage/provenance map -> duplicate check -> coverage check -> approval -> freeze -> implementation**

No step may be bypassed.

## Gate A — V2 authority

- Audit only the current `apps/kairo-ui-v2` page/components/styles for UI authority.
- Audit the current domain/API/migrations for backend authority.
- Do not infer requirements from legacy UI.

## Gate B — Pixel/UI inventory

Create an inventory from the approved mockup and current V2 page. Every item must be represented exactly once:

- page shell/breadcrumb/header
- hero properties
- labels/badges/chips
- media
- metrics
- sections/tabs
- expanded state
- minimized/collapsed state
- buttons
- links
- menus
- filters/selectors
- save/dismiss/develop/create/regenerate controls
- disabled controls and blocked reasons
- loading state
- empty state
- zero-result state where applicable
- degraded state
- failure state
- retry state
- timestamps/freshness
- provenance/source links

A page contract fails if a visible property/control has no backend source or explicitly documented derived source.

## Gate C — Existing-schema-first

Before adding any field/table/type/endpoint, search current migrations, domain types, repositories and routes for the same business concept.

Classify every required property as one of:

- **REUSE** — canonical existing field/model/route is sufficient.
- **DERIVE** — compute from canonical existing data without persistence duplication.
- **EXTEND** — existing canonical object needs additional validated properties.
- **ADD** — no canonical concept exists; new schema is justified.
- **UI-ONLY** — presentation state derived entirely client-side and must not be persisted.

**ADD is forbidden until REUSE/DERIVE/EXTEND have been ruled out with evidence.**

## Gate D — Single source of truth / no duplicate

The same business fact must not be persisted in two independent authorities.

Examples for Opportunity Preview:

- `public_signals` remains canonical for source URL, platform, publisher/author, published/retrieved timestamps and source provenance.
- `brand_opportunities` remains canonical for opportunity identity, rationale, why-now, development direction, status, existing ranking dimensions and `brand_context_version`.
- `brand_opportunity_signals` remains canonical for opportunity-to-signal evidence links.
- `hunter_run_records` remains canonical for Hunter run status, snapshot version, plan version, evidence/candidate/opportunity counts, scanned/degraded sources and run failure data.
- existing concept-mockup columns remain canonical for Opportunity Concept Mockup persistence.

A page-level read model may **compose** these sources but must not create a second persistence authority for them.

## Gate E — Page read model vs persistence

A page read model is allowed to contain repeated/composed values for delivery convenience, but each field must declare `sourceOfTruth`.

Example:

```text
source.url -> public_signals.source_url [REUSE]
outlier.creatorMultiplier -> opportunity_details.outlier.creatorMultiplier [EXTEND]
lineage.snapshotVersion -> hunter_run_records.snapshot_version [REUSE]
conceptMockup -> brand_opportunities.concept_mockup [REUSE]
```

The read model is not automatically a database schema.

## Gate F — Actions and controls coverage

Every interactive control in the approved mockup must map to one of:

- existing endpoint/action,
- existing action requiring a thin V2 proxy,
- approved new endpoint,
- explicitly client-only interaction.

Every action must define:

- authorization boundary,
- request contract,
- success response,
- disabled condition,
- error condition,
- retry/idempotency behaviour where relevant,
- resulting persisted state.

No dead button and no frontend-guessed entitlement/state.

## Gate G — Property coverage matrix

Before approval, produce a matrix with columns:

| UI element/property | Required? | Existing source | Classification | API/read-model field | Nullable? | UI fallback rule | Persistence authority | Test |
|---|---|---|---|---|---|---|---|---|

Coverage must be 100% for all mockup-visible controls/properties.

## Gate H — State coverage matrix

Each page must explicitly cover applicable states:

- loading
- authenticated success
- partial/degraded
- unavailable property
- empty
- zero results
- failed
- retrying
- stale
- unauthorized/forbidden
- action pending
- action failed
- action succeeded

No fabricated fallback may be used to hide missing backend data.

## Gate I — Lineage and provenance

Every intelligence/output field must be traceable where applicable to:

- Brand/workspace
- Brand context/snapshot version
- Hunter run
- discovery plan version
- source signal(s)
- scoring/model/schema version
- generated concept/content version
- timestamps

Lineage references must reuse canonical IDs/versions instead of copying disconnected values.

## Gate J — Versioned extensible JSON only where appropriate

`brand_opportunities.opportunity_details` already exists as JSONB and should be used as the extension point for genuinely opportunity-specific structured intelligence not already canonical elsewhere.

Rules:

- document must carry an explicit schema version,
- validate its structure in application/domain code (and DB checks where practical),
- do not duplicate canonical `public_signals`, `brand_opportunities`, `hunter_run_records` or concept-mockup properties,
- promote heavily queried/sorted fields to indexed relational/generated columns only when actual query requirements justify it.

## Gate K — Contract tests

For every page contract add/plan tests for:

1. complete happy-path response,
2. every nullable/unsupported platform metric,
3. degraded source,
4. stale data,
5. forbidden cross-workspace/brand access,
6. missing opportunity/not found,
7. each visible action,
8. response schema validation,
9. no authenticated demo/fallback data,
10. lineage points to existing canonical records.

## Gate L — Approval and freeze

A page cannot be implemented until both are approved:

1. UI mockup/state set,
2. backend/page schema contract with 100% coverage matrix.

Once approved, both are frozen. Changes require explicitly reopening the affected page/contract.

---

# Opportunity Preview V1 — verified reuse map

The frozen Opportunity Preview is the first page governed by this gate.

## Existing canonical schema to reuse

### `public_signals`
REUSE:
- `id`
- `title`
- `summary`
- `source_url`
- `platform`
- `publisher`
- `author`
- `published_at`
- `retrieved_at`
- `provider`
- `provider_version`
- `content_hash`

### `brand_opportunities`
REUSE:
- `id`
- `workspace_id`
- `brand_id`
- `title`
- `rationale`
- `why_now`
- `development_direction`
- `status`
- `relevance`
- `evidence`
- `novelty`
- `timeliness`
- `brand_authority`
- `audience_fit`
- `overall`
- `scoring_version`
- `brand_context_version`
- timestamps

### `brand_opportunity_signals`
REUSE:
- opportunity -> source signal evidence relationship.

### `hunter_run_records`
REUSE:
- `run_id`
- `snapshot_version`
- `plan_version`
- trigger/status/timestamps
- evidence/candidate/opportunity counts
- `sources_scanned`
- `degraded_sources`
- failure code/message

### Opportunity Concept Mockup
REUSE:
- `brand_opportunities.concept_mockup`
- `concept_mockup_version`
- `concept_mockup_generated_at`

## Existing canonical actions/routes to reuse where semantically correct

- Hunter run history/latest routes.
- Opportunity feedback route for current supported feedback semantics.
- Opportunity development route.
- Existing V2 proxy/actions should be preserved unless a semantic mismatch requires extension.

## `opportunity_details` extension scope

Use `brand_opportunities.opportunity_details` only for genuinely missing opportunity intelligence, e.g. a versioned document containing:

- source-performance snapshot fields not canonical on `public_signals` (views, likes, comments, shares, saves, follower count at observation time),
- creator/niche baseline calculations,
- outlier multiplier/velocity/recurrence/evidence-confidence details,
- structured `whyItWorked`,
- structured `yourMove`,
- analysis-specific confidence and model/schema versions.

Do **not** duplicate source URL/platform/author/published time, opportunity identity/status/base scoring dimensions, Hunter run state/versions, or concept-mockup persistence into this document.

## Frozen Opportunity UI contract boundary

The approved page remains:

**existing hero unchanged -> compact evidence summary -> Why It Worked -> Your Move -> Concept Mockup**

Only these tabs/sections are approved:

**Why It Worked -> Your Move -> Concept Mockup**

Performance is not an Opportunity tab.

## Final implementation rule

Before coding Opportunity Preview V1, a field-by-field 100% coverage matrix must be produced from the frozen mockup and reconciled against this reuse map. Any proposed new field or endpoint must show why existing schema/actions cannot satisfy it.
