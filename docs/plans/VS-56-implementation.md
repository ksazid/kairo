# VS-56 Implementation Plan — Brand Brain + Review & Control

## Goal

Remediate UI-05 from issue #94 without changing Brand Brain persistence, generation, source ingestion or production behaviour.

## Execution sequence

### 1. Establish a deterministic Brand Brain presentation model

- centralise the approved Brand Brain field/section definitions used by the UI;
- derive structured profile summaries from existing fields;
- treat every `inferred` and `stale` field as review work;
- generate truthful state/provenance labels for confirmed, source-backed inferred, owner-context inferred, stale and unset states;
- provide stable field anchors for Review & Control navigation;
- cover this behaviour with web unit tests.

### 2. Remediate the primary Brand Brain page

- replace the page-local sidebar and pilot mobile navigation with `KairoProductShell` and `KairoScopePicker`;
- replace the 2x2 summary-card grid with a structured profile list;
- make human attention explicit when inferred/stale fields exist;
- keep a single review decision path rather than duplicate `Review & Control` calls to action;
- move setup into native progressive disclosure after the initial empty state;
- preserve the existing owner goal, owner boundary and optional public-reference form;
- show Knowledge/source state as supporting context, not a competing working panel.

### 3. Remediate Review & Control

- use the shared Kairo product shell;
- put the review queue before the full field editor;
- make Brand Brain sections native disclosure groups, automatically opening sections that contain review work;
- retain all existing field editing/confirmation semantics;
- state clearly that saving an inferred field confirms it;
- move Knowledge source management below the Brand Brain fields in a separate disclosure surface;
- preserve source enable/disable/remove and private-note/link behaviours.

### 4. Keep mutations in task context

- route Review & Control field saves and Knowledge mutations back to Review & Control;
- preserve a field/source anchor after the redirect;
- do not modify API/domain/database contracts.

### 5. Verification and review

- run the full repository exact-head gate wave: Product Intake, Security baseline and CI;
- run implementation-level UI Review against the approved Kairo baseline;
- inspect changed paths, review threads and exact head/base state;
- do not claim rendered browser validation unless an approved exact-candidate environment is actually available;
- stop for explicit certification/merge approval;
- do not deploy to Vercel or any other environment.

## Expected changed runtime paths

- `apps/web/app/brands/[brandId]/brain/page.tsx`
- `apps/web/app/brands/[brandId]/brand-brain-control/page.tsx`
- `apps/web/app/brands/[brandId]/brand-brain-control/actions.ts`
- `apps/web/app/guided-brain.css`
- `apps/web/src/lib/brand-brain-view-model.ts`
- `apps/web/src/lib/brand-brain-view-model.test.ts`

## Explicit exclusions

No API, database, migration, model runtime, Universal URL Reader, OAuth/provider, Content Asset Library, publishing, scheduling, Vercel policy or deployment changes.
