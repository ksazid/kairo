# VS-71 Implementation Plan — Research Start Flow Repair

## Scope
Repair only the missing production wiring between an existing Idea and the already-implemented Researcher/Strategist pipeline. Preserve approved FR-08/FR-09 semantics and the existing VS-70 publishing path.

## Method
PES/Loop remains authoritative. Use Superpowers execution discipline: inspect authority → bounded plan → regression test first → implementation → deterministic review/CI → stop before certification/merge/release.

## Step 1 — API regression test
Add a failing API test for `POST /api/v1/brands/:brandId/ideas/:ideaId/research` using a deterministic development port. Prove the route returns persisted Research + at least two Angles, is repeat-safe, preserves tenant-safe not-found behavior and reports unavailable runtime clearly.

## Step 2 — Application route
Add a narrow `IdeaDevelopmentPort` to the API composition boundary. The route must authenticate, resolve the Brand/Idea in scope, short-circuit if Research + usable Angles already exist, invoke the configured development port otherwise, then re-read authoritative persisted state.

## Step 3 — Production orchestration wiring
Reuse existing components instead of duplicating logic:
- `PgResearchRepository.saveResearchDossier`;
- `PgResearchRepository.saveCandidateAngles`;
- `ResearcherOrchestrator`;
- `StrategistOrchestrator`;
- `SourceRoutingToolGateway`;
- OpenAlex and Crossref public research evidence providers;
- configured Kairo Direct/Hermes runtime.

The general research query is derived from the explicitly user-developed Idea. Public evidence providers remain bounded; provider output remains untrusted. Research and strategist runtime output must pass their existing validators before persistence.

## Step 4 — Runtime schema registration
Register `research-dossier@1` and `strategist-angles@1` validators in the existing runtime validator map. Export the Strategist worker subpath so API composition does not bypass package boundaries.

## Step 5 — Web action
Add one server-side web API helper and server action. In the existing no-research state, render one primary `Start research` action with concise explanatory copy. Do not redesign the page or introduce a second competing primary action.

## Step 6 — Safe retry behavior
If authoritative Research and two or more candidate/selected Angles already exist, return them unchanged. If Research exists but Angles do not, run only the Strategist. Do not create duplicate Research Dossiers.

## Step 7 — Verification
Required checks through repository CI/preflight:
- API unit/regression tests;
- Researcher/Strategist existing tests;
- PostgreSQL integration suite;
- web typecheck/build;
- workspace typecheck/tests;
- security/intake/preflight.

No migration, publishing worker, infrastructure or release workflow changes are permitted.

## Step 8 — Stop gate
After implementation and CI are green, prepare an exact-SHA certification candidate and stop. Do not merge, deploy, release or production-enable without a separate human instruction.
