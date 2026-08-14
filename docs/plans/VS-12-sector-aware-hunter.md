# VS-12 Plan — Sector-Aware Hunter Source Routing

Status: Planning only. Runtime implementation must not begin until VS-11 / PR #35 release-candidate governance is reconciled and VS-12 is activated with scope + implementation approval.

## Goal

Extend the existing generic Hunter so Brand context selects the most relevant public discovery sources without creating industry-specific Hunter implementations.

The target architecture is:

```text
Brand Brain
  ↓
Brand Intelligence Profile
  ↓
Sector Intelligence Pack
  ↓
Source Policy Resolver
  ↓
Source Query Planner
  ↓
Generic Hunter
  ↓
Reusable provider adapters
  ↓
Signals → normalize/dedupe/cluster → Brand relevance → Opportunity
```

## Requirement traceability

Primary:
- FR-03 Brand Brain
- FR-04 Knowledge and sources
- FR-06 Hunter / Discover
- FR-07 Duplicate and novelty intelligence
- FR-08 Research dossier

Operational:
- FR-20 Pilot Operations and Controls

No change is proposed to FR-15 publishing. Instagram remains a ChannelAdapter concern, not a global discovery source abstraction.

## Design rules

1. One Hunter engine. Do not create TravelHunter, EducationHunter, TextileHunter, BikeHunter, etc.
2. Add adapters by technical provider/protocol, not by industry.
3. Sector behaviour is predominantly versioned configuration.
4. Brand-private context may influence scoring and source selection but must never enter Global Intelligence.
5. Public signals can be reused globally only under existing visibility policy.
6. Every signal retains source/provider provenance.
7. A source failure must be isolated; one provider cannot fail the Hunter run.
8. Free/public quotas are treated as budgets, not as unlimited capacity.
9. Deterministic filtering/deduplication happens before model-backed judgment wherever possible.
10. Hunter must continue to support `No strong opportunity found.`

## Existing foundation to preserve

Kairo already owns:
- `HunterOrchestrator`
- `DiscoverySourceProvider`
- `KairoToolGateway`
- public Signal normalization/provenance
- Brand relevance judgment
- Opportunity persistence and novelty rules

VS-12 extends these boundaries; it does not replace them.

## New domain/configuration concepts

### BrandIntelligenceProfile

Derived from approved Brand Brain fields where possible rather than duplicating Brand state.

```ts
interface BrandIntelligenceProfile {
  sector?: string;
  subsector?: string;
  geographies: string[];
  languages: string[];
  audiences: string[];
  topics: string[];
  excludedTopics: string[];
  goals: string[];
}
```

### SectorIntelligencePack

Versioned, reviewable configuration describing domain taxonomy and source preferences.

```ts
interface SectorIntelligencePack {
  id: string;
  version: string;
  sector: string;
  subsectors: string[];
  topics: string[];
  entities: string[];
  eventTypes: string[];
  sourceWeights: Record<string, number>;
  queryTemplates: string[];
  evidencePolicy?: Record<string, unknown>;
}
```

Initial proof packs:
- AI / SaaS / Developer Technology
- Umrah / Religious Travel
- Motorcycles / Bikes
- IAS / UPSC Education

These four are intentionally different enough to prove the generic design.

### SourceRegistry

Describes reusable discovery/research sources and operational limits.

Initial source keys:
- `agent-reach` (existing fallback)
- `rss`
- `youtube`
- `hacker-news`
- `bluesky`
- `openalex` (research)
- `crossref` (research verification)

Registry metadata should include capabilities, supported scopes, trust hints, quota/budget hints, enabled state and credential requirement.

### SourcePolicyResolver

Pure deterministic domain service:

```text
BrandIntelligenceProfile
+ SectorIntelligencePack
+ SourceRegistry
→ BrandSourcePolicy
```

Output includes enabled/disabled sources, weight, rationale and query intent. It must be unit-testable without network or model calls.

### SourceQueryPlanner

Turns source policy + Brand context into bounded provider queries. It must cap query count per source and deduplicate overlapping query intents.

## Adapter plan

### Phase A — no-auth/free adapters

- Hacker News: official public API; technology-heavy source; enabled for relevant sectors only.
- Bluesky: public AppView endpoints; secondary social discussion signal.
- RSS/Atom: generic feed adapter driven by approved feed registry; feeds are sector configuration, not new code.

### Phase B — free-quota adapters

- YouTube Data API: API-key based; disabled safely when key absent; query-budget aware.

### Phase C — research adapters

- OpenAlex: evidence/research discovery, not default Hunter noise.
- Crossref: DOI/publication provenance and verification.

## Example source policies

### AI brand

```text
tech RSS          0.95
hacker-news       0.95
youtube           0.90
bluesky           0.70
agent-reach       0.60 fallback
openalex          research-only
crossref          verification-only
```

### Umrah brand

```text
approved official/RSS sources  1.00
youtube                         0.90
travel feeds                    0.85
agent-reach                     0.55 fallback
bluesky                         0.25
hacker-news                     0.00
openalex                        research-only when relevant
crossref                        verification-only when relevant
```

### Motorcycle brand

```text
motorcycle/automotive RSS       0.95
youtube                         0.95
manufacturer/official feeds     0.95
transport/regulatory feeds      0.85
agent-reach                     0.60 fallback
bluesky                         0.45
hacker-news                     0.20 for EV/software topics
```

### IAS / UPSC education brand

```text
official government/RSS         1.00
approved current-affairs feeds  0.90
youtube                         0.80
agent-reach                     0.55 fallback
bluesky                         0.20
hacker-news                     0.05 only for material science/tech topics
```

## Hunter execution changes

Current flow:

```text
query → one DiscoverySourceProvider → evidence → Hunter judgment → Opportunity
```

Target flow:

```text
Brand context
  ↓
SourcePolicyResolver
  ↓
SourceQueryPlanner
  ↓
selected DiscoverySourceProviders
  ↓
provider-isolated fetch with timeout/budget
  ↓
normalize
  ↓
URL/content-hash dedupe
  ↓
cheap deterministic relevance/freshness filter
  ↓
cross-source cluster/corroboration metadata
  ↓
bounded evidence set
  ↓
existing Hunter judgment
  ↓
Opportunity
```

The model never receives an unbounded raw feed.

## Cost-control rules

- Run public discovery globally where practical, then reuse public signals across Brands.
- Do not search YouTube independently for every Brand when multiple Brands share an intent.
- Cache source results within source-appropriate freshness windows.
- Enforce per-source query/request ceilings per run/day.
- Record provider request count, accepted signal count and rejected/noise count.
- Do not send obvious duplicates/low-relevance results to the model.
- Preserve the existing agent budget ceiling unless a later approved decision changes it.

## Failure and safety rules

- Individual adapter timeout/error → mark provider degraded and continue with remaining sources.
- Missing optional credential → adapter disabled, not global Hunter failure.
- Rate/quota exhaustion → stop that adapter and surface operational telemetry.
- Malformed source payload → reject at adapter boundary.
- Private Brand data must not be copied into shared Signal records.
- No unrestricted scraping or browser-cookie/session harvesting.

## Implementation slices

### VS-12A — Sector-aware routing foundation

- Brand Intelligence Profile projection
- Sector pack schema/registry
- Source registry
- SourcePolicyResolver
- SourceQueryPlanner
- tests proving AI, Umrah, Motorcycle and IAS choose materially different source policies
- preserve existing Agent Reach as fallback

No external provider expansion required to prove the architecture.

### VS-12B — Free discovery adapters

- RSS/Atom adapter
- Hacker News adapter
- Bluesky adapter
- YouTube adapter
- provider isolation, quotas, telemetry and deduplication
- integration tests with deterministic fakes/fixtures

### VS-12C — Research enrichment

- OpenAlex adapter
- Crossref adapter
- Researcher routing based on evidence policy
- provenance and cache rules

### Separate publishing follow-up — Instagram production completion

Keep separate from Hunter because the risk and provider boundary are different:
- customer Meta OAuth / Connect Instagram
- Reels
- carousel
- concrete Instagram Insights collector
- webhooks
- Meta Advanced Access/app-review readiness

## Acceptance criteria

1. The same Hunter implementation handles AI, Umrah, Motorcycle and IAS Brands.
2. Sector packs change source selection/weights without branching Hunter domain logic by industry.
3. HN is disabled for Umrah by policy while highly weighted for AI.
4. A generic RSS adapter can serve official Umrah feeds, motorcycle feeds and education/government feeds through configuration only.
5. Provider failures are isolated and observable.
6. Every evidence item retains provider/source provenance.
7. Free-quota sources are bounded by deterministic request budgets.
8. Duplicate/cross-source signals are collapsed before model judgment.
9. Brand-private context remains isolated from Global Intelligence.
10. Existing Hunter no-filler behaviour remains intact.
11. Existing Agent Reach fallback remains replaceable and can be disabled without rewriting Hunter domain logic.
12. Tests demonstrate that the four proof sectors produce different policies from the same resolver.

## Verification

Before certification:
- targeted domain/unit tests
- worker tests
- API/integration tests where persistence changes exist
- `npm run governance:validate`
- `npm run preflight`
- security review for any new credential/network boundary
- exact-SHA certification

## Governance sequencing / current blocker

VS-11 is currently the active certified slice and PR #35 is the pilot/auth release candidate. Do not mix VS-12 runtime work into PR #35.

Required sequence:
1. Reconcile PR #35 with VS-11 exact-SHA certification/release records.
2. Complete or formally transition/supersede VS-11 as governed.
3. Activate VS-12A with scope + implementation approval.
4. Use Superpowers plan/worktree/TDD execution.
5. Certify VS-12A before expanding into VS-12B.

## Paperclip position

Paperclip is not a Kairo runtime dependency and does not replace PES/Loop/Superpowers. If adopted, it sits outside the product repository as an optional engineering-agent control plane for coordinating multiple coding/review agents. GitHub remains authoritative and all Paperclip-issued work must obey the active slice, allowed paths, approvals, preflight, certification, merge and release gates.

Do not introduce Paperclip into Kairo product/runtime code as part of VS-12.
