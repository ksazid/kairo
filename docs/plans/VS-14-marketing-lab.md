# VS-14 Implementation Plan — Kairo Marketing Lab

## Objective
Implement the minimum Kairo-owned foundation needed to compare native marketing intelligence against pinned external challengers without production-enabling those challengers.

## Design decisions
- Keep VS-14 in the existing modular monolith.
- Add deterministic domain modules under `packages/domain`; do not add a new workspace/dependency.
- Treat Kairo Native as the baseline/control.
- Treat Corey skills as pinned source manifests with `reference-only` execution mode.
- Separate **qualification** from **execution**. A benchmark can advance a challenger to another stage, but cannot grant runtime permissions.
- Model Reel and Carousel strategies as typed benchmark artifacts; publishing is a separate slice.
- Cost/latency are guardrails, not marketing-quality points that can offset Truth failures.

## TDD sequence

### Step 1 — Skill registry red tests
Add tests that require:
- native baseline is executable;
- reference-only candidate is never executable;
- external source requires exact commit provenance;
- candidate selection is capability-aware;
- duplicate skill version IDs are rejected;
- unqualified challengers cannot become Brand selections.

### Step 2 — Skill registry implementation
Implement:
- `MarketingCapability`;
- `SkillSourceRef`;
- `MarketingSkillManifest`;
- registry validation/query functions;
- qualification/execution guards.

### Step 3 — Creative format red tests
Add Reel/Carousel validation tests covering:
- required hook/CTA;
- bounded carousel slide count;
- ordered Reel scenes and duration boundaries;
- Claim lineage;
- rejection of empty/generic malformed plans.

### Step 4 — Creative format implementation
Implement deterministic `CarouselPlan` and `ReelPlan` contracts/validators.

### Step 5 — Benchmark red tests
Cover paired comparison semantics:
- Truth failure always blocks challenger;
- incomplete pairing returns insufficient evidence;
- a tie keeps native;
- immaterial improvement keeps native;
- clear quality improvement can advance to shadow;
- excessive cost/latency blocks advancement;
- missing human/live evidence prevents Brand qualification;
- live evidence must meet minimum comparable-sample policy;
- Brand-specific results do not become global winners automatically.

### Step 6 — Benchmark engine implementation
Implement:
- benchmark stages (`offline`, `shadow`, `live`);
- per-case evaluation record;
- paired baseline/challenger aggregation;
- configurable quality dimensions/thresholds;
- hard-gate policy;
- stage verdicts;
- Brand/capability/format qualification record.

### Step 7 — Corey source manifests
Add deterministic evaluation manifest pinned to:
`7868cb9251fad80a73d26e488a5ad5f6c4a9f335`

Initial paths: social, video, content-strategy, copy-editing, marketing-psychology.

Record exact source path/hash/licence/capability mapping and `reference-only` execution mode. Do not vendor upstream prompt bodies.

### Step 8 — Four-sector benchmark fixtures
Add a small deterministic fixture set for architecture verification across:
- AI/SaaS;
- Umrah/religious travel;
- Motorcycles;
- IAS/UPSC education.

Each format set should include at least one carousel and one Reel case. Fixtures use synthetic/public-safe Brand context, not private production Brand data.

### Step 9 — Integration boundary
Expose the new domain modules through `@kairo/domain` exports. Do not modify Strategist/Drafter runtime routing yet.

### Step 10 — Review and lifecycle
- Run typecheck/tests/build.
- Confirm no external network/secret/publishing execution path exists.
- Confirm no API/web/database/infrastructure path changed.
- Run governance/preflight/security.
- Move lifecycle implementing → testing → certification only with clean evidence.
- Freeze exact certification SHA and request human certification+merge.

## Initial benchmark policy
The foundation uses configurable defaults intended for conservative advancement, not universal truth:
- paired cases required;
- Truth pass rate must be 100% for controlled offline qualification;
- no advancement on tie/insufficient evidence;
- minimum material quality improvement required;
- cost and latency ratios have configurable ceilings;
- human preference/edit-distance evidence is required before live eligibility;
- comparable real-world samples are required before Brand qualification;
- a Brand qualification is scoped by Brand + capability + format + candidate version.

Thresholds are code/config policy inputs and can be calibrated later from benchmark data; they are not marketing claims.

## Follow-up slices deliberately deferred
1. Instagram carousel + Reel publishing/OAuth/media lifecycle.
2. Instagram Insights normalization for Reel/carousel performance.
3. Sandboxed external skill execution and shadow runs.
4. Live experiments and Brand-specific automatic routing policy.
5. Kairo-native skill improvements derived from winning benchmark techniques.
