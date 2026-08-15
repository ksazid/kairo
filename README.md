<p align="center">
  <img src="docs/assets/pes-overview.png" alt="Product Engineering Starter Overview" width="100%">
</p>

# Kairo

Kairo is the customer-facing product name for the approved **Content Intelligence Engine (CIE)** venture.

This repository was created from the Product Engineering Starter (PES) template. PES remains the governance and delivery framework; Kairo's approved product definition lives under `product/`.

## Approved product authority

- `product/PRD.md` — CIE-PRD-001 v1.0
- `product/TRD.md` — CIE-TRD-001 v1.0
- `product/DESIGN.md` — CIE-DESIGN-001 v1.0
- `product/GLOSSARY.md` — CIE-GLOSSARY-001 v1.0
- `product/VENTURE-PACKAGE.yaml` — frozen Kairo venture package approved for PES
- `evaluation/SKILLS-ARCHITECTURE.md` — approved dynamic Skills architecture input
- `decisions/DECISIONS.md` — authoritative Innovation Hub decision record copied for traceability

## Delivery authority

PES controls intake, traceability, planning, vertical slices, approvals, Loop lifecycle, deterministic checks, certification and human merge/release authority.

Superpowers is the default implementation methodology **inside** the PES loop after a slice is approved and activated.

The authoritative live delivery state is recorded in:

- `delivery/current-slice.json` — current governed slice/lifecycle state;
- `delivery/completed-slices.json` — certified historical slices;
- `.engineering/STATE.json` — next permitted engineering action;
- `delivery/decisions.json` — machine-readable approved decisions;
- `delivery/backlog.json` — governed future-slice backlog when populated.

README is a human-readable feature ledger, not a replacement for those authority files.

## Kairo implementation profile

Kairo uses the approved **PES Web/AI profile** direction:

- Next.js + React + TypeScript for web;
- Node.js + TypeScript modular-monolith API/workers;
- Python only for approved runtime components such as Hermes integration;
- PostgreSQL as authoritative system of record;
- provider-neutral AI boundaries;
- Brand-aware sector/source policy;
- dynamic governed Brand-aware Skill Registry as an approved architecture direction;
- deterministic Truth/Claims and publishing controls.

## Feature ledger

Status terms:

- **Implemented / governed** — runtime capability exists in Kairo and was delivered through governed slices.
- **Partial** — useful runtime foundation exists, but important production/channel capability remains incomplete.
- **Architecture / evaluation** — approved direction or candidate only; not an installed production dependency.

| Capability | Status | Current Kairo implementation |
|---|---|---|
| Account / Workspace / Brand | Implemented / governed | Tenant and Brand identity, membership and Brand scope foundation. |
| Brand Brain / Knowledge | Implemented / governed | Brand-private context, knowledge sources, provenance and safe deletion/ingestion controls. |
| Hunter / Discover | Implemented / governed | Public discovery, Signals, Opportunities, Brand relevance and evidence lineage. |
| Sector-aware Hunter | Implemented / governed | `BrandIntelligenceProfile`, sector packs, source registry/policy resolution and source query planning. |
| Free public discovery | Implemented / governed | RSS/Atom, Hacker News, Bluesky public AppView and YouTube Data API adapters behind the generic Hunter. |
| Research / Claim Ledger | Implemented / governed | Research dossiers, sources, uncertainty, structured Claims and evidence-backed downstream context. |
| Strategist / Angles | Implemented / governed | Multiple candidate Angles with audience, objective, hook direction, format/channel guidance and Claim lineage. |
| Campaign / Content Studio | Implemented / governed | Campaign lineage, Content Assets, immutable Content Versions and generation/editing flows. |
| Drafter | Implemented / governed | Bounded Brand-scoped drafting/revision using supplied Claims; no publishing authority. |
| Critic / Judge / Truth Gate | Implemented / governed | Independent review, deterministic truth/policy enforcement, bounded revision and exact-version human approval. |
| Calendar / Publishing | Implemented / governed | Deterministic publishing jobs, idempotency/retries/reconciliation and official channel-adapter boundary. |
| Instagram publishing | Partial | Official Instagram Professional image + caption publishing adapter exists; customer OAuth, Reels, carousel, concrete Insights and webhooks remain future work. |
| LinkedIn publishing | Implemented / governed foundation | Official organization publishing adapter boundary and governed scheduling/publishing flow. |
| Performance tracking | Implemented / governed | Raw/normalised metric model, provenance, asynchronous collection boundary and Brand baselines. |
| Performance learning | Implemented / governed | Evidence-scoped Candidate Learnings with cautious correlation and bounded next-experiment proposals. |
| Pilot operations / safety / cost | Implemented / governed | Operational states, retries, intervention/safety controls and bounded runtime/cost behavior. |
| Paperclip control plane | Architecture / evaluation | Approved evaluation candidate only; native control path remains authoritative and Paperclip is not a runtime dependency. |
| Dynamic Skill Registry / Capability Router | Architecture / evaluation | Approved TRD architecture, but external executable marketing skills are not currently installed as production runtime dependencies. |
| Corey Haines `marketingskills` | Architecture / evaluation | Already listed in `evaluation/SKILLS-ARCHITECTURE.md` as a candidate source; not installed or production-enabled. |

## Current content intelligence loop

```text
Brand Brain
  + Sector / Audience / Geography
        ↓
Sector-aware Hunter
        ↓
RSS / HN / Bluesky / YouTube / approved discovery providers
        ↓
Signals → Opportunities
        ↓
Research → Claims
        ↓
Strategist → candidate Angles
        ↓
Campaign / Content Studio
        ↓
Drafter
        ↓
Truth Gate → Critic → Judge
        ↓
Human approval
        ↓
Deterministic channel adapter
        ↓
Performance metrics
        ↓
Candidate Learning
```

## Skills: what exists vs what is planned

Kairo's agents already perform core content roles through Kairo-owned contracts: Hunter, Researcher, Strategist, Drafter, Critic, Judge and Learner. These are **not the same thing as installing third-party marketing skills**.

The approved TRD also defines a future Dynamic Skill Registry and Capability Router so multiple implementations can compete for capabilities such as hook generation, carousel planning, content strategy, channel adaptation and humanisation. External skills must be pinned, permission-scoped, benchmarked and explicitly promoted; upstream repository changes must never change Kairo production behavior automatically.

`evaluation/SKILLS-ARCHITECTURE.md` is the current evaluation register for candidate external skill sources. It already includes Corey Haines `marketingskills` alongside other candidates.

## Future / deferred improvements

The following are **not current production claims**. They are approved directions, evaluation candidates or logical next enhancements and must enter runtime only through a separately approved governed slice.

- OpenAlex and Crossref research/evidence adapters.
- Instagram customer OAuth/account connection.
- Instagram Reels and carousel publishing.
- Concrete Instagram Insights collection and webhooks.
- Dynamic Skill Registry / Capability Router runtime foundation.
- Benchmark selected marketing capabilities against Kairo's native Strategist/Drafter/Critic baseline before adoption.
- Candidate marketing capabilities for evaluation: social strategy, content strategy, hook strategy, carousel strategy, copy editing and short-form video strategy.
- Paperclip control-plane spike only if native orchestration becomes insufficient and the evaluation gates justify the operational overhead.

When a future item becomes approved work it should be moved into the governed delivery backlog/slice model rather than being treated as implemented merely because it appears here.

## External-skill adoption rule

Do **not** copy or install an external skill repository wholesale into Kairo.

For each candidate capability:

```text
External candidate
  → licence / provenance / security review
  → pin revision + package hash
  → declare permissions / network / secret requirements
  → benchmark against Kairo native baseline
  → human review
  → governed Skill Registry entry
  → Brand-scoped selection / controlled rollout
  → performance + safety monitoring
```

Kairo-owned non-replaceable controls remain authoritative: Workspace/Brand isolation, Truth/Claims policy, publishing authorization, secret handling, cost budgets, metric provenance, Brand Learning policy and skill approval/benchmarking.

## PES workflow

```text
Approved venture package
→ product / technical / security intake
→ source-linked requirements
→ roadmap / milestones / epics / vertical slices
→ typed approvals
→ activate one slice
→ Superpowers planning / TDD / implementation / review
→ deterministic preflight
→ certification
→ human merge / release approval
```

See `AGENTS.md` and `docs/governance/END-TO-END.md` for the authoritative repository workflow.
