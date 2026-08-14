# VS-12A Implementation Map — Sector-Aware Hunter Foundation

Status: planning-only until VS-11 is no longer the active slice and VS-12A is activated with typed scope + implementation approvals.

## Existing code that remains authoritative

- `apps/worker/src/hunter.ts`
  - owns `HunterOrchestrator`
  - preserves `No strong opportunity found` behavior by allowing zero evidence / zero candidates
  - performs Brand-private judgment after public evidence collection
  - persists only evidence-linked candidates
- `apps/worker/src/discovery-provider.ts`
  - owns `DiscoverySourceProvider` implementation and `KairoToolGateway`
  - currently routes `public-content-search` to one provider (`AgentReachDiscoveryProvider`)
- `packages/domain/src/discovery.ts`
  - owns public Signal normalization/provenance rules
- `packages/domain/src/discovery-service.ts`
  - owns opportunity persistence and duplicate/novelty policy
- `packages/agent-contracts/src/index.ts`
  - owns provider-neutral discovery/tool contracts

VS-12A must extend these boundaries rather than create industry-specific Hunters.

## New files planned for VS-12A

### 1. `packages/domain/src/source-policy.ts`

Pure deterministic domain logic. No HTTP, models, database calls or provider SDKs.

Planned types:

```ts
export type DiscoverySourceKey = string;

export interface BrandIntelligenceProfile {
  sector?: string;
  subsector?: string;
  geographies: string[];
  languages: string[];
  audiences: string[];
  topics: string[];
  excludedTopics: string[];
  goals: string[];
}

export interface DiscoverySourceDefinition {
  key: DiscoverySourceKey;
  capabilities: Array<"discovery" | "research" | "verification">;
  enabled: boolean;
  requiresCredential: boolean;
  maxQueriesPerRun: number;
}

export interface SectorIntelligencePack {
  id: string;
  version: string;
  sector: string;
  subsectors: string[];
  topics: string[];
  sourceWeights: Record<DiscoverySourceKey, number>;
  queryTemplates: string[];
}

export interface BrandSourcePolicyEntry {
  source: DiscoverySourceKey;
  enabled: boolean;
  weight: number;
  maxQueries: number;
  rationale: string;
}

export interface BrandSourcePolicy {
  packId: string;
  packVersion: string;
  entries: BrandSourcePolicyEntry[];
}
```

Planned functions:

- `resolveBrandSourcePolicy(profile, pack, sourceRegistry)`
- `planSourceQueries(profile, pack, policy)`

Rules:

- weights are clamped/validated to `0..1`;
- a disabled registry source can never be enabled by a sector pack;
- `weight === 0` means disabled for that Brand/sector;
- research-only sources are excluded from Hunter query plans;
- query counts are bounded by both pack intent and source registry ceiling;
- duplicate normalized query intents are collapsed;
- excluded Brand topics are removed before query generation;
- no private Brand text is written into global Source definitions.

### 2. `packages/domain/src/source-policy.test.ts`

TDD-first proof cases.

Required tests:

1. **AI policy**
   - Hacker News high weight (`>= 0.9`)
   - YouTube high weight
   - RSS high weight
   - Umrah-specific sources absent/disabled
2. **Umrah policy**
   - official/RSS + YouTube high
   - Hacker News exactly disabled (`0` / `enabled: false`)
3. **Motorcycle policy**
   - automotive RSS + YouTube high
   - HN low but optionally enabled for software/EV relevance
4. **IAS/UPSC policy**
   - official/government RSS highest
   - YouTube medium/high
   - HN near-zero/disabled unless explicitly configured
5. Registry disabled source overrides sector weight.
6. Query planner never exceeds per-source query budget.
7. Query planner deduplicates equivalent intents.
8. Excluded topics never appear in planned queries.
9. Same resolver implementation is used for all four sectors (no sector-name branching in resolver logic).
10. Invalid pack weights fail deterministic validation.

### 3. `packages/domain/src/sector-packs.ts`

Versioned configuration data, not branch-heavy business logic.

Initial proof packs:

- `ai-technology@1`
- `umrah-religious-travel@1`
- `motorcycles@1`
- `ias-upsc-education@1`

Source keys initially refer to capabilities even before VS-12B provider implementations exist:

- `agent-reach`
- `rss`
- `youtube`
- `hacker-news`
- `bluesky`
- `openalex`
- `crossref`

The resolver must not contain `if (sector === ...)` logic. Sector differences live in pack data.

### 4. `packages/domain/src/source-registry.ts`

Initial deterministic registry describing source capabilities and budgets.

VS-12A registers planned sources but only existing `agent-reach` is operational. VS-12B supplies real provider adapters for RSS/HN/Bluesky/YouTube.

### 5. `packages/domain/package.json`

Add package exports for source-policy / sector-pack APIs only if direct subpath imports are required. Prefer importing through a single intentional domain module rather than proliferating exports.

## Existing files planned to change

### `apps/worker/src/hunter.ts`

Add an optional sector-aware planning dependency while keeping explicit-query compatibility.

Target behavior:

```text
Brand context
  -> profile projection
  -> sector pack selection
  -> source policy
  -> bounded query plan
  -> discovery gateway
  -> existing evidence uniqueness
  -> existing Hunter judgment
  -> existing evidence-linked Opportunity persistence
```

Compatibility rule:

- existing callers that provide an explicit `query` continue to work;
- VS-12A must not force every call through the new planner until the Brand profile/pack is available;
- no provider-specific SDK/network logic enters `HunterOrchestrator`.

### `apps/worker/src/hunter.test.ts`

Add integration-level unit tests proving:

- explicit-query compatibility remains intact;
- AI and Umrah inputs generate materially different planned source intents using the same orchestrator/planner boundary;
- no evidence still returns zero opportunities;
- evidence lineage remains mandatory.

### `apps/worker/src/discovery-provider.ts`

VS-12A should make only the minimum contract preparation required for later multi-provider routing. Real multi-source HTTP adapters belong to VS-12B.

Do not implement HN/RSS/Bluesky/YouTube network calls in VS-12A.

## Brand Intelligence Profile projection

Prefer deriving the profile from already-approved Brand Brain data instead of persisting a second authoritative Brand profile in VS-12A.

Projection inputs should map from existing Brand fields where available:

```text
Brand Brain category/description -> sector/subsector candidate
Brand geography                  -> geographies
Brand language                   -> languages
Brand audience                   -> audiences
preferred topics/pillars         -> topics
prohibited subjects              -> excludedTopics
Brand goals                      -> goals
```

If a required structured field is not yet available, VS-12A should represent it as optional/empty rather than inventing data or introducing a migration prematurely.

A later slice may persist user-confirmed sector classification if product validation proves it is needed.

## Source selection model

The source router follows data, not industry-specific classes.

Example data only:

```ts
const aiPack = {
  sourceWeights: {
    "rss": 0.95,
    "hacker-news": 0.95,
    "youtube": 0.90,
    "bluesky": 0.70,
    "agent-reach": 0.60,
    "openalex": 0.50,
    "crossref": 0.40,
  },
};

const umrahPack = {
  sourceWeights: {
    "rss": 1.00,
    "youtube": 0.90,
    "agent-reach": 0.55,
    "bluesky": 0.25,
    "hacker-news": 0.00,
    "openalex": 0.10,
    "crossref": 0.10,
  },
};
```

The resolver treats both identically.

## VS-12B handoff contract

VS-12A should leave a clean seam for a future provider collection such as:

```ts
interface DiscoveryProviderRegistry {
  get(source: DiscoverySourceKey): DiscoverySourceProvider | undefined;
}
```

VS-12B can then implement:

- `RssDiscoveryProvider`
- `HackerNewsDiscoveryProvider`
- `BlueskyDiscoveryProvider`
- `YouTubeDiscoveryProvider`

without changing sector pack or resolver logic.

## Adverse-effect controls designed into VS-12A

- **Noise:** query budgets and excluded topics are deterministic before any model call.
- **LLM cost:** policy/query planning is pure software; model budget remains unchanged.
- **Source bias:** source weights are explicit and reviewable per sector.
- **Quota exhaustion:** query plans are bounded even before providers exist.
- **Cross-Brand leakage:** policy uses Brand-private context transiently; global source definitions contain no Brand-private data.
- **Provider churn:** source key + provider adapter boundary remains replaceable.
- **Sector proliferation:** new sectors add pack data, not new Hunter classes.

## Governance activation checklist

Runtime work begins only after all are true:

1. VS-11 / PR #35 exact-head certification is reconciled.
2. VS-11 is transitioned through its governed release/closure path or otherwise formally completed/superseded by an explicit human decision.
3. `docs/slices/VS-12.md` exists.
4. `delivery/current-slice.json` is activated as VS-12 with requirement IDs `FR-03`, `FR-04`, `FR-06`, `FR-07`, `FR-08`, `FR-20` as applicable.
5. Typed `scope` approval records the approved sector-aware Hunter scope.
6. Typed `implementation` approval grants `runtime-enabled` implementation.
7. Allowed paths include `packages/domain/**`, `apps/worker/**`, relevant tests, `docs/slices/VS-12.md`, `docs/plans/**`, and required `delivery/**` metadata.
8. Superpowers sequence is followed: context -> plan -> TDD -> execution -> deterministic checks -> review -> preflight -> certification.

## Current unlock dependency

PR #35 current head is `eca0880c9b74760840accf059eaa189f3708675b`.

Verified repository evidence at planning time:

- CI run #349: passed on the exact head.
- Security baseline #310: passed on the exact head.
- Vercel status: success on the exact head.
- PR is open and mergeable.
- The current head is explicitly **not yet certified/release-approved**.

No certification, merge, release or production-enable action is performed by this planning branch.
