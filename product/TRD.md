---
title: Content Intelligence Engine Technical Requirements Document
document_id: CIE-TRD-001
version: 1.0
status: Approved
owner: Architecture and Engineering
last_updated: 2026-08-22
depends_on:
  - CIE-PRD-001
  - ventures/content-intelligence-engine/evaluation/SKILLS-ARCHITECTURE.md
used_by:
  - PES intake
  - CIE implementation
  - CIE pilot
---

# Content Intelligence Engine Technical Requirements Document v1.0

## Technical authority

This is the approved technical authority for Content Intelligence Engine v1.0. PES may decompose this architecture into numbered vertical slices but may not silently replace approved technical policy. Material architectural changes require an ADR or approved Innovation Hub decision.

PES remains technology-neutral governance. CIE will use a Web/AI implementation profile at PES handoff for TypeScript, Python, AI-evaluation, database, agent-runtime and skill-security execution rules. This profile extends PES implementation guidance; it does not replace PES governance, Loop, approval gates, certification or human merge authority.

## Engineering principles

CIE engineering optimises for strong Workspace/Brand isolation, closed-loop performance learning, low pilot operating cost, replaceable providers, auditable intelligence, deterministic publishing, bounded agent execution, dynamic skills, simple deployment and vertical-slice delivery.

Primary rule:

> Agents for judgement. Deterministic software for guarantees.

## Architecture style

CIE V1 uses a web-first modular monolith with asynchronous workers.

```text
Next.js Web
    |
    | HTTPS / JSON
    v
TypeScript Modular API
    |
    +-- PostgreSQL (system of record)
    +-- Qdrant (derived semantic index)
    +-- S3-compatible object storage
    +-- durable PostgreSQL-backed jobs
    |
    v
CIE Worker
    |
    +-- AgentRuntimePort -> Hermes preferred / direct-model fallback
    +-- AgentControlPlane -> native / Paperclip candidate
    +-- Skill Registry + Capability Router
    +-- Model Gateway
    +-- Tool Gateway
    +-- Channel Adapters -> Instagram / LinkedIn
```

V1 does not require microservices, Kubernetes, Kafka, a service mesh, a data warehouse or mandatory Redis.

## Technology direction

### Web

- Next.js;
- React;
- TypeScript;
- responsive accessible UI;
- typed API contracts;
- shared design tokens with future mobile.

### API and workers

- Node.js + TypeScript;
- modular monolith;
- Fastify or equivalent lightweight framework selected by PES/ADR;
- OpenAPI;
- structured logging;
- OpenTelemetry-compatible traces and metrics;
- explicit migrations;
- PostgreSQL-backed durable jobs for V1.

### Agent runtime

Hermes Agent is the preferred reasoning-runtime candidate. Hermes remains outside the authoritative CIE domain model and is accessed through an application-owned runtime port. A direct-model runtime must remain viable as fallback.

### Python boundary

Python is permitted where it is the natural runtime for approved agent/runtime components, initially Hermes integration. Python services must expose versioned contracts and may not become an alternative business source of truth.

### Mobile

Future mobile direction is React Native + Expo + TypeScript. Mobile is not required to prove the initial V1 intelligence loop.

## Repository direction

```text
apps/
  web/
  api/
  worker/
services/
  hermes-runtime/        # only when adopted
packages/
  contracts/
  domain/
  agent-contracts/
  skill-sdk/
  channel-sdk/
  design-tokens/
  observability/
product/
  PRD.md
  TRD.md
  DESIGN.md
delivery/
docs/
infrastructure/
scripts/
.github/
```

Paperclip remains an external candidate/service until separately approved; it is not vendored into CIE Core by this TRD.

## Module boundaries

### Identity
Accounts, sessions, Workspace membership, export/deletion and authorisation.

### Workspace
Workspace configuration, policies, ownership and future billing boundary.

### Brands
Brand creation, identity, positioning, audience, goals and Brand-level settings.

### Knowledge
Sources, documents, URLs, provenance, ingestion, removal and derived knowledge.

### Discovery
Global Hunter, Signals, clustering, deduplication, novelty and Brand relevance.

### Research
Evidence dossiers, Claims, references, uncertainty, freshness and reusable public research.

### Ideas
Idea lifecycle, duplicate checks, development state and candidate Angles.

### Campaigns
Campaign parent objects, channel executions and experiment grouping.

### Content
Content Assets, versions, metadata, Content Studio state and approval lineage.

### Skills
Skill Registry, versions, capabilities, permissions, Brand selections, routing and benchmarks.

### Agents
Hunter, Researcher, Strategist, Drafter, Critic, Judge, Analyst and Learner contracts.

### Publishing
Approval enforcement, scheduling, adapters, retries, reconciliation and external post state.

### Analytics
Metric ingestion, normalisation, baselines and provenance.

### Learning
Candidate Learnings, evidence, confidence, contradictions and supersession.

### Cost
Model/tool/search usage, per-Brand accounting and workflow budgets.

### Pilot Operations
Failures, retries, manual intervention, safety actions and audit.

## Dependency rules

- Domain modules never call provider SDKs directly.
- Provider-specific code stays behind ports/adapters.
- Web/mobile depend on API contracts, not persistence implementation.
- External agents cannot directly persist authoritative domain state.
- Skills and agents cannot bypass domain policy.
- Publishing and credential use remain deterministic infrastructure responsibilities.
- Cross-module writes occur through application use cases.

## Tenant and Brand isolation

Brand isolation is a hard architecture requirement.

Every Brand-owned relational record carries `workspace_id` and `brand_id` where applicable. The server validates authenticated Workspace/Brand access on every operation; possession of a Brand identifier is never authorisation.

PostgreSQL Row-Level Security should be evaluated as defence in depth in addition to application-level policy.

Semantic/vector entries must include mandatory scope metadata such as:

```text
workspace_id
brand_id
memory_type
source_type
visibility
created_at
confidence
```

There must be no unscoped private Brand-vector query API. Private Brand intelligence must never be retrieved for another Brand without an explicitly approved policy.

## PostgreSQL

PostgreSQL is the authoritative system of record for Accounts, Workspaces, Brands, Brand Brain, Sources, Signals, Ideas, Research, Claims, Angles, Campaigns, Content versions, approvals, publishing state, Posts, Metrics, Experiments, Learnings, Skills, Agent jobs, costs and audit records.

Neither vectors, agents, prompts nor external control planes are authoritative over business state.

## Semantic intelligence

Preferred semantic layer:

```text
VectorRetrievalProvider
  |-- QdrantTurboQuantProvider   # preferred production direction
  |-- PgVectorProvider           # fallback/tests
  `-- TurboVecProvider           # R&D only
```

Qdrant is a derived retrieval index. Semantic data must be reproducible from authoritative records and source documents. Loss of Qdrant must degrade semantic features without destroying business truth.

Representative Brand-memory data must be benchmarked for recall, latency, storage, filtering correctness and cost before final provider promotion.

## Object storage

Use private S3-compatible storage for uploaded documents, images, audio/video, source captures and generated media. Records retain object identifier, Workspace/Brand scope, content type, content hash, size, source and retention state. Public bucket access is disabled by default.

## Durable jobs

V1 uses PostgreSQL-backed durable jobs for Hunter runs, research, Brand ingestion, generation, Critic review, publishing, metric collection, Learnings, notifications and safe retries.

Jobs retain at minimum job ID, Workspace/Brand scope, type, state, attempt/max attempts, schedule, lease, timeout, budget and timestamps. Workers use leases/locking to prevent duplicate execution. Repeated failure enters an explicit review/dead state.

## Global Hunter

Public discovery is shared where safe:

```text
Public sources
  -> Global Hunter
  -> normalise / deduplicate
  -> Global Signal Store
  -> per-Brand relevance scoring
  -> Brand Opportunities
```

CIE must not run an expensive full public-web Hunter independently for every Brand when the underlying factual signal can be shared. Private Brand sources do not automatically enter Global Intelligence.

Public factual research may be reused across Brands when provenance and visibility permit; Brand-specific interpretation and strategy remain private.

## Agent model

Logical roles are Hunter, Researcher, Strategist, Drafter, Critic, Judge, Analyst and Learner. A role is an execution contract, not necessarily a permanent process.

Each invocation receives explicit task ID, Workspace/Brand scope, approved context, selected skills, tool permissions, model policy, token/turn/tool budgets, timeout and retry policy. Agents receive least-privilege context rather than unrestricted Workspace access.

Initial configurable reasoning ceilings are approximately: Hunter 5-8 turns, Researcher 10, Strategist 5, Drafter 4, Critic 3, revisions maximum 2 cycles, Judge 1-2, Analyst 4 and Learner 3. These are operational defaults, not immutable product constants.

## Agent runtime boundary

```text
AgentRuntimePort
  runAgent(task)
  cancelAgent(taskId)
  getStatus(taskId)
```

Preferred implementation: `HermesAgentRuntime`.
Fallback: `DirectModelRuntime`.

Agent output must return to the CIE application layer for schema, policy, provenance and state-transition validation before persistence.

## Agent control-plane boundary

```text
AgentControlPlane
  dispatch()
  cancel()
  pause()
  resume()
  getRun()
  setBudget()
```

Candidates:

- NativeControlPlane;
- PaperclipControlPlane.

Paperclip is approved for evaluation, not implementation by default. Before adoption, a spike must prove Hermes adapter reliability, tenant/Brand isolation, CIE source-of-truth authority, budget enforcement, audit retention, safe failure behaviour, acceptable operational overhead and replaceability without domain rewrite.

If the spike does not justify Paperclip, CIE uses the native control plane.

## Dynamic Skill Registry

CIE does not freeze one permanent skill set. Skill scopes are Global, Workspace and Brand. Multiple approved implementations may satisfy a capability such as hook generation, carousel planning, Instagram adaptation, LinkedIn adaptation, profile analysis, transcription analysis, humanisation or content strategy.

Core entities include Skill, SkillVersion, SkillCapability, SkillPermission, SkillInstallation, BrandSkillSelection, SkillBenchmark and SkillExecution.

Skill sources may include CIE-owned packages, approved GitHub repositories, skills.sh-compatible packages, EvoMap-compatible assets, private Workspace skills and a future CIE marketplace.

V1 should start with an admin-vetted catalogue plus Brand-level selection rather than unrestricted arbitrary public package execution.

Every executable external skill retains source, author, licence, upstream URL, pinned revision/version, package hash, capability, permissions, network policy, secret requirements, risk classification, compatibility, benchmark status, approval status, install date and last review date. Upstream changes never alter production behaviour automatically.

## Capability routing

Agents request capabilities from a CIE-owned router rather than searching arbitrary skill directories.

Resolution order considers hard policy, Brand selection, compatibility, approval status, benchmark status, cost, historical Brand evidence and fallback. The selected skill version is persisted with each execution.

CIE may benchmark competing skills using human preference, Brand fit, factuality, originality, Critic pass rate, edit distance, latency, cost and downstream performance. Correlation must not be reported as causation.

## Non-replaceable CIE controls

Arbitrary skills may not replace authentication, tenant isolation, Truth/Claims policy, publishing authorisation, approved-version enforcement, spend controls, secret policy, metric provenance, Brand Learning policy, skill approval/benchmarking or cross-Brand privacy.

The Critic may use skills, but deterministic hard-fail policy remains CIE-owned.

## Truth and Claims Gate

Research produces a structured claim ledger with text, source IDs, evidence strength, freshness, factual/opinion classification, first-person status, Brand authorisation and verification state.

Before external publishing, deterministic policy rejects unsupported factual claims, fabricated first-person experience, prohibited Brand statements, missing required attribution and claims relying on evidence outside freshness policy.

The Critic or Judge cannot override a hard Truth/Claims failure.

First-person claims require an authorised Brand source such as user-supplied biography, confirmed Brand Brain fact, verified previous content or explicit user instruction. Otherwise the content is rewritten without fabricated experience.

## Drafter, Critic and Judge separation

```text
Research
  -> Drafter
  -> Truth/Claims Gate
  -> Critic
  -> bounded revision if valid
  -> Judge
  -> Human approval
```

The Critic does not rely on the Drafter's hidden reasoning. Hard policy failures fail the workflow rather than being offset by a high aggregate quality score.

## Model Gateway

All model access goes through a provider-neutral `ModelGateway` supporting approved providers such as OpenAI-compatible endpoints, Gemini, Anthropic, OpenRouter, Nous and Ollama/local models.

Model selection is policy-driven by role, quality requirement, privacy, latency and cost. Every invocation records provider, model/version, settings, token usage, cost and safety result.

Target text-oriented AI inference COGS is below approximately $5 per active Brand/month, excluding heavy media generation, premium data sources and social connector costs. This is a validation target, not a guarantee.

## Publishing

Publishing is deterministic:

```text
Approved Content Version
  -> Schedule
  -> Publishing Command
  -> Channel Adapter
  -> External API
  -> External Post ID / explicit failure
```

Agents never receive direct social-account credentials or unrestricted publication tools.

V1 channel adapters target Instagram and LinkedIn. Publish commands require approved version, destination account, idempotency key and scheduled time where applicable. Editing approved content creates a new version requiring reapproval.

Publishing requires bounded retries, exponential backoff, duplicate prevention, external ID storage, explicit failure state, operator retry, rate-limit handling and reconciliation for unknown external state after timeouts.

OAuth/provider tokens are encrypted, scoped, revocable and accessible only to deterministic channel adapters.

Instagram account connection supports two provider-neutral authentication adapters: Instagram Login for a Professional account without a Facebook Page, and Facebook Login for Page/Facebook plus linked Professional Instagram discovery. The same Instagram/Website adapter boundaries serve onboarding and later Brand Brain refresh. Health projections expose scopes, verification/sync times, expiry and recovery state, never plaintext credentials.

Meta operations are exposed through replaceable MCP tools above an application-owned `InstagramPublisher`; MCP does not own tenancy, approval, asset locking, retry policy or secrets. Image, carousel and Reel publishing binds commands to the exact approved media fingerprint and persists provider container, media ID, published URL and lifecycle state.

Creative rendering accepts only approved resolved raster assets and supported bounded font assets. Remote URLs and unapproved asset identifiers are not render authority. Carousel output is 1080×1350 (4:5); generated carousel/Reel thumbnails are deterministic private objects keyed by the immutable source fingerprint and persisted with the rendered version. Temporary signed delivery is produced only at the adapter boundary.

## Metrics and Performance Memory

Metric ingestion is asynchronous. Raw channel metric snapshots are retained sufficiently to reproduce derived results, then normalised into supported CIE metrics. Unsupported channel metrics remain explicitly unavailable rather than inferred.

Performance Memory preserves dimensions including Brand, Audience, Topic, Hook, Angle, Format, Channel, Timing, CTA, Campaign and Outcome. PostgreSQL remains authoritative; semantic representations may support retrieval and similarity analysis.

The pattern reader compares only Brand-scoped published posts with available numerator and reach/impression evidence. Topic, hook, structure, template, format and UTC timing candidates retain published-post and normalised-metric IDs. Missing metrics are excluded. Candidate observations are causally restrained and remain separate until a human accepts the Learning.

## Learning

The Learner produces `CandidateLearning`, not permanent Brand truth. Each candidate retains supporting posts/data, time range, sample size, confidence, contradictory evidence, scope and suggested action.

`CandidateLearning.patterns` stores typed dimension/value observations with their own evidence subset. Accepted Learnings are projected into Brand Brain Performance Memory and may influence explainable format ranking; candidate, rejected and superseded Learnings cannot silently change confirmed Brand Brain fields.

Lifecycle may include Candidate, Accepted, Active, Weakened, Superseded and Rejected. New evidence may reduce or supersede prior learning.

EvoMap Evolver remains an optional `EvolutionProvider` R&D candidate. Any proposed Gene, Capsule, strategy or skill revision must pass benchmark, safety evaluation and approval/policy before production use.

## Prompt-injection boundary

Websites, documents, competitor content, social content, external skills and API payloads are untrusted input. Retrieved text cannot grant tools, request secrets, alter system policy, change Brand scope, bypass approval or change skill permissions. Tool permission is supplied by application policy only.

## API model

- HTTPS JSON;
- `/api/v1`;
- OpenAPI generated from code;
- problem-details-compatible errors;
- cursor pagination where needed;
- idempotency keys for retried commands;
- optimistic concurrency for sensitive writes;
- SSE or equivalent for long-running workflow progress where beneficial.

Primary groups include Account, Workspaces, Brands, Knowledge, Discover, Ideas, Research, Campaigns, Content, Skills, Calendar, Publishing, Performance, Learnings, Experiments and internal Pilot Operations.

## Observability

Use structured logs, OpenTelemetry-compatible traces and metrics. Long-running workflows correlate trace ID, job ID, Workspace/Brand scope, Campaign, agent role, skill version and model where applicable. Sensitive content is not logged by default.

## Security

Required controls include encryption in transit/at rest, strong tenant scoping, secret isolation, audit logs, rate limiting, signed uploads, content-type/size validation, SSRF protections, malware scanning where appropriate, permission-aware skills, no secrets in prompts, dependency/secret scanning and deletion propagation into vectors/object storage.

## Testing and AI evaluation

Deterministic tests cover domain logic, APIs, PostgreSQL integration, tenant isolation, state transitions, migrations, idempotency, publishing reconciliation and adapter contracts.

Versioned AI evaluation sets cover Hunter relevance, research factuality, Angle quality, Brand fit, hook quality, Critic/Truth Gate behaviour, skill routing and performance interpretation.

Adversarial tests cover prompt injection, cross-Brand leakage, fabricated experience, malicious skills, stale claims and conflicting sources.

Minimum end-to-end validation path:

```text
Create Brand
 -> Brand Brain
 -> Discover
 -> Research
 -> Campaign
 -> Draft
 -> Critique
 -> Approve
 -> Publish/manual publish
 -> Metrics
 -> Learning
```

## Deployment direction

Use simple managed infrastructure: Node-compatible web hosting, container-capable API/worker PaaS, managed PostgreSQL, managed/controlled Qdrant and S3-compatible storage. Exact vendors are deployment ADRs, not core architecture.

## Safe degradation

- Qdrant unavailable -> relational history remains available; semantic features degrade.
- Hermes unavailable -> prior content remains usable; new AI work queues/fails safely.
- Paperclip unavailable -> no CIE domain-state loss; native control path remains viable.
- social API unavailable -> content retains visible approved/scheduled/failed state.
- metrics delayed -> CIE displays stale/unavailable status and never invents metrics.

## Explicit V1 technical exclusions

CIE V1 does not require microservices, Kubernetes, Kafka, event sourcing, a warehouse, unrestricted third-party skills, arbitrary code execution inside the API process, autonomous publishing, ad-spend infrastructure, cross-customer model training, large GPU infrastructure, mandatory Paperclip, mandatory Evolver or standalone TurboVec as a production dependency.

## PES Web/AI implementation profile

At PES handoff, CIE will use a stack-specific implementation profile while PES core governance remains unchanged.

The profile must define at least:

- Node/TypeScript package and repository conventions;
- Python service/runtime conventions;
- TypeScript-Python contract/versioning rules;
- lint, format, type-check and test commands;
- PostgreSQL migration/registry rules;
- AI evaluation and regression gates;
- skill provenance, permission and security gates;
- tenant-isolation tests;
- agent budget/timeout controls;
- observability requirements;
- deployment checks.

PES continues to own approved-slice orchestration, Loop, Superpowers usage, deterministic checks, review, CI/security/product gates, certification and human-approved merge.

## Technical validation gates before implementation commitment

Before promoting external infrastructure dependencies, PES must run focused spikes for:

1. Hermes role invocation, skill injection, cancellation, budgets, provider routing and structured output.
2. Paperclip control-plane value and replaceability; evaluation only until separately approved.
3. Qdrant/TurboQuant recall, latency, storage, filtering and cost with representative Brand memory.
4. Skill version pinning, permission declaration, safe loading and malicious-instruction rejection.
5. Instagram and LinkedIn API feasibility for the exact V1 publishing/metric requirements.

## Final technical decision

CIE V1 is a TypeScript modular monolith with PostgreSQL as authoritative source of truth, Qdrant as a derived semantic layer, durable asynchronous workers, provider-neutral AI boundaries, Hermes as the preferred but replaceable agent runtime, a dynamic Brand-aware Skill Registry, deterministic Truth/Claims and publishing controls, and an optional Paperclip control-plane integration that must prove its value before adoption.

PES remains technology-neutral and will execute CIE through a reusable Web/AI implementation profile rather than changing its governance model.
