# VS-26 implementation plan — Guided Brand Brain Setup & Review Control

## Governing sources
- `product/PRD.md` FR-02, FR-03, FR-04, FR-20
- `product/TRD.md` Brand/Knowledge boundaries, Brand isolation, deterministic application authority
- `product/DESIGN.md` Brand Brain structured-profile requirement and calm/product-first interaction baseline
- `delivery/decisions.json` DEC-006 deletion/provenance policy
- `docs/slices/VS-26.md`

## Implementation method
PES/Loop remains authoritative. Superpowers methodology: bounded plan, TDD for domain/API/security behaviour, deterministic verification before certification.

## Step 1 — Governed activation
- Register VS-26 against FR-02/03/04/20.
- Record scope + implementation approval from the owner.
- Keep VS-23 and VS-24 inactive and blocked by their existing evidence gates.

## Step 2 — RED contracts/domain tests
- Add guided-build request/response contracts.
- Add `BrandBrainBootstrapService` tests proving:
  - goal is owner-confirmed;
  - hard directive is owner-confirmed;
  - inferred proposals require sources;
  - confirmed fields are not replaced;
  - invalid/unsupported proposals are rejected/ignored;
  - safe degradation when the generator is unavailable.

## Step 3 — Public reference + proposal adapters
- Add a bounded public Brand reference reader with URL, DNS/public-address, redirect, timeout and response-size controls.
- Add tests for unsafe/local/private targets, redirect handling and bounded content.
- Add a strategist-backed Brand Brain proposal orchestrator with an explicit allow-list and no tools.
- Treat public page text as untrusted data, never instructions.

## Step 4 — API integration
- Add authenticated `POST /api/v1/brands/:brandId/brain/bootstrap`.
- Wire optional model runtime; safe-degrade when model inference is unavailable.
- Preserve Brand/Workspace authorization and source provenance.

## Step 5 — Guided web experience
- Reduce first Workspace/Brand setup to Brand name + one public reference (website/social profile); Workspace name remains required account structure.
- On Brand Brain, ask primary objective + optional hard directive and provide **Build my Brand Brain**.
- Show compact review cards for Positioning, Audience, Voice and Content strategy plus explicit items needing review.
- Keep inferred/confirmed/needs-review state visible.

## Step 6 — Advanced Brand Brain / Review & Control
- Move the full detailed field editor behind a clear advanced disclosure/surface.
- Keep every current correction control and provenance state.
- Simplify Knowledge entry to **Add a link** and **Paste knowledge**; preserve document safety note and existing source lifecycle controls.

## Step 7 — verification and review
- Run typechecks/tests/preflight/governance in CI.
- Review responsive and accessibility states.
- Review public-source SSRF/failure behaviour and Brand isolation.
- Freeze exact certification candidate only after all deterministic gates pass.

## Non-goals
No migration, infra/release workflow, deployment, Meta/Auth configuration, Marketing Lab live activation or Brand skill rollout.
