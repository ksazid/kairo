# VS-05 Implementation Plan — Campaign and Content Studio

## Scope

Implement FR-10 Campaign and FR-11 Content Studio only. Preserve the approved Kairo modular-monolith/runtime/design boundaries. Do not implement Critic/Judge acceptance, approval, scheduling, publishing, channel credentials, performance learning, arbitrary executable Skills, release or production enablement.

## Method

PES/Loop remains authoritative. Execute with the installed Superpowers methodology: bounded plan → TDD → implementation → deterministic verification → specification/code/UI/security review → exact-SHA certification preparation.

## Step 1 — Campaign and content domain contracts

TDD first. Define Brand-scoped Campaigns retaining Idea/Research/selected-Angle lineage, optional channel executions, Content Assets and append-only immutable Content Versions. Test cross-scope lineage rejection, selected-Angle requirements, monotonic versions, safe bounds and draft-only state.

## Step 2 — PostgreSQL persistence and isolation

Add a forward-only migration and dedicated repository. Test Workspace/Brand isolation, safe guessed-ID behavior, lineage persistence, optimistic version appends and idempotent Campaign/generation commands.

## Step 3 — Application and API surface

Add authenticated operations to create/list/read Campaigns, create/read Content Assets and versions, append manual edits, request contextual generation actions and compare history. Do not expose provider secrets, arbitrary Skill execution or publishing.

## Step 4 — Contextual generation orchestration

Reuse `AgentRuntimePort` and `ModelGateway` with Brand-private scope, explicit context, bounded budgets, schemas and zero model-controlled tool calls. Support initial draft, alternative, simplify, expand, technical-depth adjustment, stronger opening and named-section regeneration. Persist runtime/model/cost/action/parent provenance. Reject unknown Claims, fabricated first-person authority and policy/capability expansion.

## Step 5 — Content Studio product UI

Extend the current Kairo shell: Campaign list/create, calm central editor, contextual secondary AI actions, evidence access, immutable version history/comparison, manual edits and loading/empty/error/conflict/pending states. Activate only implemented Campaigns/Content routes; keep Calendar and Performance marked Later.

## Step 6 — Traceability and observability

Update FR-10/FR-11 traceability. Correlate Workspace, Brand, Campaign, asset, version and runtime invocation without logging sensitive content by default.

## Step 7 — Deterministic verification

Run domain/API/PostgreSQL/runtime tests, tenant/concurrency/provenance checks, Next typecheck/build, accessibility/responsive/state review, `npm run preflight`, CI and Security baseline.

## Step 8 — Review and certification preparation

Create `docs/plans/VS-05-review.md` and `docs/plans/VS-05-certification.md`. Stop for explicit human certification of the final exact SHA. Future merge authorization is recorded, but certification remains a separate mandatory gate.
