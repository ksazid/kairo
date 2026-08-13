# VS-03 Superpowers Implementation Plan — Hunter and Discover

Status: Approved implementation plan
Slice: VS-03 — Hunter and Discover
Requirements: FR-06, FR-07
Governance: `delivery/current-slice.json`, `delivery/context/VS-03.md`, AUTH-001
Decisions: DEC-005 approved; DEC-003 pending and blocks certification only

## Objective

Build the smallest governed vertical path from public Signal acquisition to Brand-scoped Opportunity decisions and Today/Discover UI while preserving Kairo-owned tenancy, provenance, state and policy. No provider is allowed to become authoritative domain state.

## Fixed guardrails

- PostgreSQL remains authoritative.
- Public Signals may be globally reusable only when visibility policy permits.
- Every Brand-owned record carries `workspace_id` + `brand_id`; every Brand read/write re-validates membership.
- No private Brand vector/query can cross Brand scope.
- Agent outputs are untrusted until Kairo schema/policy/provenance validation succeeds.
- Hermes gets no unrestricted shell, database write authority, raw model/social credentials, browser cookies or arbitrary network access.
- Agent Reach stays behind `ToolGateway` as a replaceable `DiscoverySourceProvider` per DEC-005.
- DEC-003 remains unresolved until the representative Qdrant/TurboQuant vs PgVector benchmark is complete; no semantic provider is promoted before that decision.
- No research dossiers/Angles, campaigns, drafting, publishing, metrics, OpenReply, paid ads or production deployment.
- The approved Kairo Design Baseline is authoritative. `design-taste-frontend` is not the primary product-workflow skill.

## Upstream evaluation pins

- Hermes candidate: `NousResearch/hermes-agent@d2c6af3aa258c47d64c41a56fe9ff61815334e17` observed 2026-08-13. Pin this exact revision for the VS-03 spike; do not track floating `main` during evaluation.
- Agent Reach: use the previously evaluated and approved DEC-005 revision recorded in `evaluation/AGENT-REACH.md`; do not silently update it during implementation.

## TDD / execution sequence

### 1. Discovery contracts and domain rules

Write failing tests first for:

- normalized public Signal evidence/provenance;
- duplicate identity by normalized/canonical URL, content hash and deterministic duplicate key;
- Brand Opportunity relevance/novelty/evidence/timeliness score validation;
- `develop | save | ignore` lifecycle transitions;
- `no strong opportunity` threshold behavior;
- same topic with materially different development direction not being hard-rejected solely by lexical similarity;
- cross-Brand access rejection.

Then implement the minimum contracts/domain methods necessary to pass.

Expected surfaces:
- `packages/contracts/**`
- `packages/domain/**`

### 2. Agent and tool boundaries

Create application-owned contracts only after tests define the behavior:

- `AgentRuntimePort` with scoped invocation envelope (role, workspace/brand scope, approved context version, capabilities, budgets/timeouts, output schema/version);
- `ModelGateway` request policy using provider-neutral quality/privacy/cost fields and returning invocation metadata without secrets;
- `ToolGateway` capability request/response with allow-list, provenance and cancellation boundary;
- `DiscoverySourceProvider` returning normalized public evidence only.

Do not add provider SDKs merely to satisfy the interface.

Expected surfaces:
- `packages/agent-contracts/**`
- `packages/skill-sdk/**` only if a concrete VS-03 Dynamic Skill manifest is required.

### 3. Hermes focused spike

Evaluate the pinned Hermes revision behind `AgentRuntimePort` for:

- deterministic structured-output handoff;
- timeout/cancellation;
- bounded tool/capability exposure;
- no raw secret injection into prompts/context;
- session/Brand isolation;
- error mapping/retry semantics;
- invocation metadata/cost observability;
- disable/remove fallback to `DirectModelRuntime` without domain changes.

Promotion rule: the spike may produce an adapter only if these controls pass. Otherwise retain the native fallback and record Hermes as not promoted.

Expected surfaces:
- `services/hermes-runtime/**`
- `evaluation/HERMES-VS-03.md`

### 4. Agent Reach focused spike

Test the DEC-005 provider boundary for:

- exact version pin;
- structured normalized output;
- URL/platform/publisher/publication/retrieval/provider provenance;
- timeout/cancellation;
- bounded network/source policy;
- secret/session isolation;
- safe disable/replacement/fallback;
- no authoritative state outside Kairo.

No direct `Hermes -> shell -> Agent Reach` path is permitted.

Expected surfaces:
- `apps/worker/**` or a provider adapter under an approved package/app boundary;
- `evaluation/AGENT-REACH-VS-03.md`.

### 5. PostgreSQL persistence

Add one migration and tenant-safe repository behavior for:

- global public Signals/evidence metadata;
- Brand Opportunities;
- Opportunity-to-Signal lineage;
- lifecycle/actions;
- deterministic duplicate keys/content hashes;
- scoring/version metadata;
- audit-relevant timestamps/provider lineage.

Integration tests must prove:

- a public Signal can support multiple Brands without copying private Brand state into the Signal;
- an account cannot enumerate/mutate another Brand's Opportunities;
- duplicate insert/update behavior is deterministic under concurrency;
- Brand filters are mandatory for Brand-owned data.

Expected surfaces:
- `apps/api/migrations/0003_hunter_discover.sql`
- `apps/api/src/postgres-store.ts`
- PostgreSQL integration tests.

### 6. Hunter / relevance orchestration

Implement the minimum orchestration path:

`DiscoverySourceProvider -> normalize/dedupe Signal -> Brand context projection -> relevance/novelty evaluation -> Opportunity threshold -> persist`

Start with deterministic scoring/fixtures for repeatable tests. AI-assisted scoring may be plugged in through `AgentRuntimePort`, but must be versioned and cannot be the only path required for deterministic CI.

A low-quality candidate must produce no Opportunity rather than filler.

Expected surfaces:
- domain/application orchestration in existing modules;
- `apps/worker/**` for scheduled/background execution only when needed.

### 7. API

Extend the existing authenticated Fastify vertical slice rather than creating a parallel API.

Minimum public product routes:

- list ranked Brand Opportunities;
- save Opportunity;
- ignore Opportunity;
- mark/develop Opportunity for the next-slice handoff without implementing VS-04 Research/Angles;
- optional bounded refresh request if orchestration supports it safely.

All routes use the existing identity/session and safe-not-found behavior.

### 8. Product-design skill prerequisite

Before substantial Today/Discover UI edits:

- verify the project-local UI UX Pro Max, Impeccable, Emil Design Engineering and Ponytail skill packages against the already-used approved copies/canonical upstreams;
- install only a complete, license-compatible package; do not create fake substitutes;
- if the full skill package cannot be installed reproducibly within the allowed path/governance boundary, record the limitation and use only the approved Design Baseline + currently installed `ui-review` rather than falsely claiming skill use.

Any `.agents/skills/**` modification requires an explicit allowed-path governance update before writing those files.

### 9. Today / Discover UI

Use the approved Design Baseline in Operate mode:

- short ranked list, not dashboard tiles;
- Opportunity title, relevance/evidence state, `Why now`, freshness and one dominant Develop action;
- Save/Ignore secondary actions;
- explicit loading, error, no-strong-opportunity and stale states;
- visible Brand context without clutter;
- desktop -> tablet -> single-flow mobile collapse;
- keyboard/focus/screen-reader semantics, >=44px important targets, reduced motion.

Keep future Research/Angle controls out of VS-03.

### 10. Semantic benchmark / DEC-003

Create a representative, privacy-safe benchmark corpus and compare:

- Qdrant + TurboQuant;
- PgVector fallback.

Measure:
- retrieval quality/recall;
- latency;
- Workspace/Brand filter correctness;
- storage footprint;
- operational complexity;
- cost;
- reproducibility/degradation behavior.

Do not resolve DEC-003 automatically. Present benchmark evidence and a recommendation for separate human approval. Certification cannot begin while DEC-003 remains pending.

### 11. Review and certification preparation

Run, in order:

1. deterministic typecheck/tests/build;
2. PostgreSQL integration tests;
3. architecture/spec review;
4. security review of agent/tool/tenant/secret boundaries;
5. UI review/accessibility/responsive review;
6. Product Intake, Security baseline and CI on exact candidate;
7. request human DEC-003 decision if still pending;
8. after DEC-003 approval and all gates green, prepare exact certification SHA and stop for human certification + merge authorization.

No release/deployment/production-enable action is included.

## Planned commit checkpoints

1. `VS-03: define discovery domain contracts and tests`
2. `VS-03: add governed agent and discovery provider contracts`
3. `VS-03: persist Signals and Opportunities`
4. `VS-03: add Hunter orchestration and API`
5. `VS-03: record Hermes and Agent Reach spike evidence`
6. `VS-03: implement Today and Discover UI`
7. `VS-03: benchmark semantic retrieval providers`
8. `VS-03: review and prepare certification`

Each checkpoint must leave deterministic checks runnable; failures loop through systematic debugging rather than weakening assertions or governance.