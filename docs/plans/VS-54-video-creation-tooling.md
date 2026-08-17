# VS-54 implementation plan — Video Creation / Editing Tooling

## Design read
A focused Content Studio production workflow: the user edits a Reel as an ordered scene timeline; density is medium; Kairo's existing calm Content Studio family remains authoritative, with timeline detail progressively disclosed rather than presented as a dense professional-NLE interface.

## Step 1 — Domain project contract (TDD)
- Add `VideoProject` as a scoped editable derivative of `ReelPlan`.
- Preserve Workspace/Brand/Campaign/Asset/source-version lineage.
- Add canonical create/validate/compile/serialize/parse operations.
- Add deterministic scene copy update, reorder and retime operations.
- Delegate final timing/Claim guarantees to the existing `validateReelPlan` contract.

## Step 2 — Content-version representation
- Keep the authoritative edit inside Kairo's existing immutable Content Version workflow rather than adding a second content-version store.
- Define a canonical Kairo-owned Video Project representation and a readable review representation.
- Fail safely for legacy/non-project Reel content; do not reinterpret arbitrary text as a valid timeline silently.

## Step 3 — Content Studio video editor
- Add a bounded Reel/video editor to the existing Campaign Content Studio.
- Primary controls: hook, scene order, scene duration, visual direction, on-screen text, voiceover, caption and CTA.
- Scene reordering and duration changes must remain keyboard-operable; drag-and-drop may never be the only interaction.
- Desktop: primary timeline/editor with supporting details disclosed below/alongside only where space allows.
- Tablet: stack scene editor and project context.
- Mobile: single-column scene sequence with explicit move-up/move-down and duration controls.
- States: legacy/not-initialized, editable, validation error, saved, review-required, approved-version stale after edit.

## Step 4 — Existing render/export integration
- Compile Video Project -> validated `ReelPlan`.
- Reuse VS-18 storyboard/render manifest and VS-20 private MP4 preparation.
- Do not add generic media transformation, provider generation, stock search, voice synthesis or a new encoder.

## Step 5 — Review/approval integrity
- Ensure Truth/Critic sees the visible creative copy (hook, on-screen text, voiceover, caption, CTA) rather than opaque project metadata.
- Any project edit creates or targets a new immutable Content Version and therefore requires fresh review/approval under existing policy.

## Step 6 — Verification
- Domain tests: scope, Claim subset, deterministic ordering, retime continuity, Reel limits, canonical serialization.
- Content Studio tests: accessible labels, keyboard scene ordering, validation/error states, exact-version save flow.
- Regression: existing text/image/carousel Content Studio paths unchanged.
- Run domain/web typecheck/tests, governance/preflight, Product Intake, Security and CI.
- Run project-local UI Review for the final UI candidate.
- Re-read latest `main` and the parallel Media Transformation branch before certification; resolve only actual integration needs and do not overwrite parallel governance state.

## Non-goals
No CapCut-style freeform NLE, arbitrary multi-track effects, generic media transformation pipeline, AI media generation, stock marketplace, voice cloning/synthesis, provider/OAuth change, automatic approval, automatic publication, deployment or production enablement.
