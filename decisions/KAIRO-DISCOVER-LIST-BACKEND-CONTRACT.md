# Kairo Discover List V2 — Frozen Backend Contract

**Status:** Approved, re-verified and frozen

**Date:** 2026-09-09

**UI authority:** latest approved Discover List V2 mockup + `apps/kairo-ui-v2`

**Governance:** `decisions/KAIRO-PAGE-SCHEMA-GATE.md`, `decisions/KAIRO-MOCKUP-DESIGN-AUTHORITY-GATE.md`, `decisions/KAIRO-V1-COMPLETION-PLAN.md`

## 1. Contract principles

- No authenticated fake/demo opportunity data.
- No fake trending, source, confidence, Brand Fit or viral probability.
- Preserve existing Discover controls and list/grid interaction.
- No new Discover API endpoint unless the existing opportunity API cannot support the approved UI.
- Reuse existing canonical tables and contracts first.
- Missing evidence is unavailable/omitted, never converted to zero.
- Content creation is independent of channel connection; channel connection is required only for publishing.
- Platform/source describes where evidence was found. Recommended channel describes where Kairo recommends the Brand publish. These are separate concepts.

## 2. Existing canonical persistence — REUSE

### `public_signals`
Canonical source/evidence identity:
- id
- title
- summary
- source_url
- duplicate_key
- platform
- publisher
- author
- published_at
- retrieved_at
- provider
- provider_version
- content_hash
- timestamps

### `brand_opportunities`
Canonical opportunity identity and scoring:
- id/workspace_id/brand_id
- title
- rationale
- why_now
- development_direction
- status
- relevance
- evidence
- novelty
- timeliness
- brand_authority
- audience_fit
- overall
- scoring_version
- brand_context_version
- opportunity_details
- timestamps

### `brand_opportunity_signals`
Canonical many-to-many opportunity-to-evidence relationship.

### `hunter_run_records`
Canonical Hunter run status, counts, scanned/degraded source state, failure state and lineage.

## 3. Minimal persistence extension

### Add one JSONB column

`public_signals.signal_details JSONB NULL`

Versioned contract:

```ts
interface PublicSignalDetailsV1 {
  schemaVersion: 1;
  sourceContentId?: string;
  sourceType?: string;
  media?: {
    type: "image" | "video" | "carousel" | "article";
    thumbnailUrl?: string;
    durationSeconds?: number;
  };
  creator?: {
    handle?: string;
    profileUrl?: string;
    avatarUrl?: string;
    audience?: {
      value: number;
      unit: "followers" | "subscribers";
      observedAt: string;
    };
  };
  metricSnapshots?: Array<{
    observedAt: string;
    values: Partial<Record<
      "views" | "impressions" | "likes" | "comments" | "shares" | "saves" |
      "reposts" | "quotes" | "points" | "stars" | "forks",
      number
    >>;
  }>;
  enrichment?: {
    provider: string;
    providerVersion?: string;
    parserVersion?: string;
    confidence?: number;
    warnings?: string[];
    provenance: Array<{
      provider: string;
      providerVersion?: string;
      sourceUrl?: string;
      retrievedAt: string;
    }>;
  };
}
```

This persists information already represented by `NormalizedSourceDocument` where available. It must not duplicate canonical `public_signals` identity fields.

## 4. Extend existing `opportunity_details`

Do not add another table.

```ts
interface OpportunityDetailsV1 {
  schemaVersion: 1;

  topic: string;
  proposedAngle: string;
  hook: string;
  targetAudience: string;
  objective: string;
  recommendedFormat: "post" | "reel" | "carousel" | "campaign";
  recommendedChannel?: "instagram" | "facebook" | "linkedin" | "youtube" | "tiktok" | string;

  primarySignalId: string;
  supportingSourceIds: string[];

  // Evidence confidence, not model confidence.
  confidence: number;
  confidenceReasons: string[];

  estimatedEffort: "low" | "medium" | "high";
  expiresAt?: string;
  intelligenceVersion?: number;

  outlier?: {
    metric: string;
    observedValue?: number;
    creatorBaseline?: {
      average: number;
      sampleSize: number;
      windowDays?: number;
      signalIds: string[];
    };
    nicheBaseline?: {
      average: number;
      sampleSize: number;
      cohortKey?: string;
      signalIds: string[];
    };
    creatorMultiplier?: number;
    nicheMultiplier?: number;
    velocity?: {
      value: number;
      unit: "per-hour" | "per-day";
      label: "normal" | "high" | "exceptional";
    };
    recency?: {
      ageHours: number;
      score: number;
    };
    recurrence?: {
      occurrenceCount: number;
      platformCount: number;
      score: number;
      signalIds: string[];
    };
    evidenceCompleteness: number;
    computedAt: string;
  };

  whyNowEvidenceRefs: string[];
}
```

Do not duplicate relational opportunity scores inside JSON.

## 5. Required Hunter pipeline correction

Current story-level deduplication must not destroy cross-platform recurrence evidence.

Required flow:

1. Discover evidence.
2. Canonical URL dedupe.
3. Preserve platform occurrences.
4. Story/topic cluster.
5. Compute cross-platform recurrence.
6. Collect source metrics and metric snapshots.
7. Compute creator/niche baselines where evidence permits.
8. Compute outlier, velocity, recency, evidence completeness and evidence confidence.
9. Compute Brand Fit using one versioned backend policy.
10. Score opportunity.
11. Persist all supporting signals.
12. Persist explicit `primarySignalId`.

`brand_opportunity_signals` remains the canonical relationship; no new relationship table.

Content-hash deduplication must not collapse legitimate cross-platform occurrences. Scope deduplication appropriately rather than treating a global content hash as sufficient identity for recurrence analysis.

## 6. Shared presentation policy

The following are backend/BFF-derived presentation values, not new persistence fields:
- Outlier display
- Brand Fit score/label
- Evidence confidence score/label
- Trend/Rising classification
- Opportunity level
- Recency label
- compact Why Now
- source label

One shared versioned presenter must be used by Discover table, Discover grid and Opportunity Preview so they cannot disagree.

Rules:
- Brand Fit is not `relevance` alone.
- Evidence confidence is not model-output confidence or an average of model scores.
- Trending is not inferred from array position or UI index.
- Unknown format/channel must stay unknown/unavailable; never default silently to Reel/Instagram.

## 7. Approved Discover row/control coverage

### Row properties
- Thumbnail/media → `signal_details.media`
- Platform logo → `public_signals.platform`
- Source content type → `signal_details.sourceType/media.type`
- Opportunity title → `brand_opportunities.title`
- Description/explanation → `rationale` / source summary
- Creator name → `author`/`publisher`
- Creator handle/avatar/audience → `signal_details.creator`
- Published age → derive from `published_at`
- Duration → `signal_details.media.durationSeconds`
- Outlier → `opportunity_details.outlier`
- Brand Fit → shared backend presenter over canonical Brand/opportunity evidence
- Confidence → `opportunity_details.confidence` as evidence confidence
- Why Now → `brand_opportunities.why_now` + evidence refs
- Topic chips → derived from canonical opportunity/source metadata
- Recommended format/channel → `opportunity_details`
- Save → existing save action
- Preview → existing opportunity route
- Dismiss → existing ignore action

### Controls preserved
- Search
- Recommended
- Trending
- Saved
- Developing
- Format
- Channel
- Source
- Table/Grid
- Refresh discovery
- Result count

No new top-level Brand Fit, Outlier, Confidence, date, sort or pagination controls are introduced by this extension.

## 8. Source and Channel semantics

- **Source/platform filter:** evidence origin, e.g. YouTube, GitHub, Hacker News, RSS, Bluesky, Instagram, Facebook, LinkedIn, TikTok when supported.
- **Channel filter:** where Kairo recommends creating/publishing content.
- Available creation channels are not limited by connected publishing accounts.
- A Brand may create for any supported channel before connection.
- Connection is required only at publish time.

## 9. Hunter/result state model

Results and latest run state may coexist.

Examples:
- latest run failed + old valid opportunities → show opportunities + failure/retry status.
- Hunter running + existing opportunities → show opportunities + running status.
- latest run succeeded with zero new opportunities + existing saved results → keep results + zero-new-results status.

Required states:
- loading
- no run yet
- running
- succeeded with results
- succeeded with zero new results
- degraded results
- failed with real failure code/message
- retrying
- filtered zero
- action pending
- action failed
- unauthorized/forbidden

Do not collapse API failure into genuine empty results.

## 10. Error/provenance requirements

- Preserve backend HTTP status, problem code and correlation ID through V2 BFF routes.
- Preserve source enrichment provider/parser provenance and extraction warnings.
- Persist scanned/degraded source information from the actual run.
- Degraded source state should retain reason/code where available and survive reload.

## 11. Migration impact

- New tables: **0**
- New JSONB columns: **1** (`public_signals.signal_details`)
- Existing JSON contract extended: **1** (`opportunity_details`)
- New Discover API endpoints: **0**
- New Discover UI controls: **0**
- Required Hunter pipeline behavior changes: **yes**
- Required removal of authenticated synthetic UI projection: **yes**

## 12. Freeze rule

This contract is the implementation authority for the approved Discover List V2 extension. It may only be changed through the page schema gate and explicit approval.