# VS-04 Implementation Plan — Ideas, Research and Angles

## Scope
Implement FR-08 Research Dossier and FR-09 Angle Development only. Preserve the approved Kairo architecture and existing VS-03 runtime boundaries. No drafting, campaign creation, publishing, scheduling, performance learning, release or production enablement.

## Method
PES/Loop remains authoritative. Execute with Superpowers: bounded plan → TDD → implementation → deterministic verification → spec/code/UI review → preflight/security → certification preparation.

## Step 1 — Domain contracts and lineage
TDD first.

Define Brand-scoped domain objects and transitions for:
- `Idea` sourced from an Opportunity or user-originated input;
- `ResearchDossier` with status/freshness/uncertainty;
- `EvidenceReference` and structured `Claim` records;
- `Angle` candidates with selection/edit lifecycle.

Required invariants:
- Workspace/Brand ownership is explicit;
- Opportunity → Idea → Research → Claim/Evidence → Angle lineage is retained;
- factual, opinion and uncertain inference classifications remain distinct;
- evidence cannot be fabricated or detached from its source;
- only one selected Angle per Idea at a time;
- VS-04 stops before content drafting.

## Step 2 — Persistence and tenant isolation
Add forward-only PostgreSQL migration(s) and a dedicated research/angle repository boundary consistent with existing Kairo persistence.

Test:
- Brand-scoped reads/writes;
- guessed IDs return safe not-found behavior;
- cross-Brand access is impossible;
- source/evidence lineage survives persistence;
- optimistic/concurrent Angle selection behaves deterministically.

## Step 3 — API surface
Add bounded application/API operations for:
- create Idea from an accepted Opportunity;
- create user-originated Idea;
- read Idea/Research/Angles;
- persist validated Research Dossier and Claims;
- persist candidate Angles;
- select/edit an Angle.

Use existing Kairo authorization/membership boundaries. Do not expose provider credentials or raw agent control surfaces.

## Step 4 — Researcher runtime orchestration
Reuse `AgentRuntimePort`, `ModelGateway` and `ToolGateway`.

Researcher input contains only approved Brand context, Idea/Opportunity lineage, allowed public-research capabilities, bounded budgets and schema expectations.

Researcher output must be schema-validated before persistence and include:
- core facts;
- evidence/source references and dates;
- important context;
- competing interpretations;
- explicit uncertainties;
- freshness;
- structured Claims with factual/opinion/inference classification and confidence/evidence strength.

Retrieved text is untrusted data. Add prompt-injection tests proving source content cannot expand tools, reveal secrets, change policy or instruct Kairo to bypass validation.

## Step 5 — Strategist / Angle generation
Generate multiple candidate framings where appropriate from the validated Research Dossier plus Brand context.

Each candidate supports:
- title/framing;
- audience;
- objective;
- hook direction;
- expected value;
- effort;
- recommended format/channel;
- supporting Claim/evidence references.

Persist only schema/policy-valid output. Keep reasoning/runtime provenance and bounded cost metadata.

## Step 6 — Product UI
Extend the existing Kairo shell; do not redesign it.

Activate `Ideas` navigation and implement:
- Ideas list/detail state;
- Research Dossier reading surface with clear facts/context/evidence/uncertainty;
- Claim/evidence inspection without overwhelming the main decision;
- side-by-side or stacked Angle comparison responsive to viewport;
- one clear select/edit action;
- loading, empty, error and stale-research states.

Apply approved design tokens. Use UI UX Pro Max for workflow/accessibility structure, Impeccable for bounded polish, Emil only for purposeful feedback/motion, and Ponytail principles for simple React/Next implementation.

## Step 7 — Deterministic verification
Run and fix until green:
- domain/unit tests;
- API tests;
- PostgreSQL integration/tenant-isolation tests;
- prompt-injection/security tests;
- runtime/model schema validation tests;
- Next.js build/typecheck;
- accessibility/responsive review;
- `npm run preflight` and required CI/security gates.

## Step 8 — Review and certification preparation
Create `docs/plans/VS-04-review.md` and `docs/plans/VS-04-certification.md` with traceability to FR-08/FR-09 and exact CI evidence.

Stop for explicit human certification on the final exact SHA. Merge remains a human gate. Release/deployment/production enablement remain unauthorized.
