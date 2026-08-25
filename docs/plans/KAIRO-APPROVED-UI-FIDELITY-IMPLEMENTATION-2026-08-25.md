---
title: Kairo Approved UI Fidelity Implementation Plan
status: Execution baseline
owner: Product Design / Frontend
last_updated: 2026-08-25
sources:
  - AGENTS.md
  - product/PRD.md
  - product/TRD.md
  - product/DESIGN.md
  - product/DESIGN-APPROVALS.md
  - product/APPROVED-UI-PAGES-CONTEXT-2026-08-25.md
  - product/approved-ui/README.md
  - docs/plans/KAIRO-UI-TRACEABILITY-2026-08-24.md
  - delivery/governance.json
  - delivery/decisions.json
  - delivery/current-slice.json
---

# Kairo approved UI fidelity implementation

## Objective

Implement the frozen Kairo UI with screenshot-level fidelity while preserving truthful runtime state, existing security/tenant boundaries, deterministic approval/publishing behaviour and repository governance.

This plan does not redesign any approved page. It converts the frozen design into an implementation contract and defines the exact verification loop required before any page can be called complete.

## Authority and conflict order

1. Approved PRD.
2. Approved TRD.
3. Approved security decisions and ADRs.
4. `product/DESIGN.md`.
5. Later explicit design approvals in `product/DESIGN-APPROVALS.md`.
6. Exact frozen visual references and SHA-256 fingerprints in `product/APPROVED-UI-PAGES-CONTEXT-2026-08-25.md` and `product/approved-ui/`.
7. Latest explicit Product Owner approval for a page/discrepancy.
8. This implementation plan.
9. Repository design/implementation skills.

If two authoritative sources conflict, do not improvise. Record the discrepancy, select the later explicit approval only when provenance is clear, otherwise stop that target until the conflict is resolved.

## Non-negotiable rules

- Frozen means no redesign, reinterpretation or generated alternative.
- Rejected/superseded variants must never be reused.
- Existing production UI is not a visual authority when it conflicts with the frozen reference.
- Do not fabricate provider readiness, connection state, analytics, usage, pricing or publishing state to match a screenshot.
- Real capability/state wins over decorative screenshot text; unavailable data must render a truthful approved empty/unavailable state.
- No raw IDs, provider internals, agent/research/critic/render/version machinery in normal creator UI unless the approved progressive-disclosure contract explicitly permits it.
- Use one shared token/component implementation before page-specific CSS.
- No new visual system, gradients, glassmorphism, AI glow, large decorative purple surfaces or mixed icon families.
- No Integrations surface unless explicitly reopened; it is excluded from the final implementation scope.
- User-facing primary navigation remains exactly Home / Content / Calendar / Insights / Brand.
- No merge, release, production enablement or deployment from this plan without the repository's exact-SHA human gates.

## Repository skill order

Use only installed project skills and keep them subordinate to the frozen design:

1. UI UX Pro Max — structure, states, responsive behaviour, accessibility.
2. Impeccable — bounded drift correction and final polish.
3. Emil Design Engineering — purposeful motion only where it clarifies state/feedback.
4. Ponytail — minimal React/Next.js implementation and component reuse.
5. UI Review — final design/accessibility/responsive evidence gate.
6. Superpowers — bounded implementation-plan execution and verification after an approved active slice exists.

`design-taste-frontend` may only supplement explicitly redesign-led/editorial surfaces; it must not replace the frozen product-workflow visual language.

## Phase 0 — governance and reference lock

Before runtime code:

- Confirm the implementation branch starts from the current `main` SHA.
- Confirm the active vertical slice permits the intended runtime paths and approved requirement IDs.
- If the current slice does not authorize broad UI work, activate a dedicated UI-fidelity slice before editing runtime files.
- Preserve any still-open post-release observation from the previous slice; do not rewrite it as validated.
- Copy all later approved/frozen page references into `product/approved-ui/` and add their fingerprints/context before implementing those pages.

### Strict stop condition

The repository currently has exact visual fingerprints/reference coverage through:

1. Home
2. Content list
3. Content preview/detail
4. Calendar
5. Insights
6. Brand
7. Avatar (Presenter)
8. AI Providers
9. Media Providers overview
10. Manage Image Provider
11. Manage Video Provider
12. Manage Voice Provider

The Product Owner has stated that all pages are now approved/frozen, but later exact visual references are not yet fully represented in the repository snapshot. Do not claim exact implementation for any later page until its final approved reference/control contract is committed. This is a fidelity safeguard, not a design reopening.

## Phase 1 — shared design system and shell

Implement/fix shared primitives first so page work cannot drift:

- Inter typography and approved type scale.
- Approved neutral/semantic colour tokens and restrained Kairo purple.
- 4px spacing grid.
- Approved border radii and low-contrast elevation.
- One outline icon family.
- Buttons, icon buttons, inputs, textareas, tabs, segmented controls, filters, chips, status badges, cards, disclosure rows, dialogs/sheets, menus, empty/loading/error states.
- Focus, keyboard, contrast, touch-target and reduced-motion behaviour.
- Desktop sidebar ~240–248px.
- Mobile quiet header ~60–64px and exactly five equal bottom-nav destinations.
- Shared Brand context must appear once; page bodies must not duplicate the Brand identity as a hero/scope card.

### Shell acceptance

- [ ] Home / Content / Calendar / Insights / Brand only in primary navigation.
- [ ] Notifications, light/dark and Profile/Settings remain secondary utilities.
- [ ] No technical/internal destinations in primary creator navigation.
- [ ] Desktop and mobile preserve the same hierarchy without copying desktop density onto mobile.

## Phase 2 — implementation batches

Implement in this order because downstream pages depend on the shared shell/content primitives.

### Batch A — Home

- Needs Attention deduplicated and user-language only.
- My Idea supports text, URL, Photo, Video and Media.
- `Get recommendations` is the primary creation action.
- For You uses the approved thumbnail/badge/save/title/rationale/impact/fit structure.
- What’s working only renders truthful metrics/sparklines.
- Hide legacy creator workflow entry points and technical research/agent machinery.

### Batch B — Content list + canonical Preview/Detail

- User-language filters: All / Needs you / Ready / Scheduled / Published; Drafts only when real.
- Thumbnail-led items and one state-aware primary action.
- Exact destination-aware preview tabs: only selected channels appear.
- Platform-aware final preview is the focal point.
- `Approve & Lock` remains dominant.
- After approval: `Publish now` primary, `Schedule for later` secondary.
- Technical lineage/history remains progressively disclosed.

### Batch C — Calendar

- Desktop calm week view with Today/range navigation; Month secondary.
- Mobile agenda/week experience, not compressed desktop month grid.
- User states only: Scheduled / Publishing / Published / Needs attention; failure recovery uses `Fix`.
- Opening an item routes to the canonical Content preview/detail, not a duplicate editor.

### Batch D — Insights

- Label is `Insights`, not Results, in user-facing navigation/copy.
- Narrative order: What happened → Why it may have happened → What to try next.
- One meaningful trend chart; avoid KPI walls.
- Evidence-backed explanation and ranked actions.
- No fabricated analytics or learning-engine internals.

### Batch E — Brand + Avatar

- Use the approved cleaner profile-style Brand page, not dashboard/card-grid variants.
- Inline-first local editing for Identity, Audience, Voice & Style and Content Pillars.
- Sources and Channels remain distinct concepts but live in the Brand experience.
- Show Confirmed / AI inferred where material.
- Avatar remains optional and linked from Brand.
- Avatar provider unavailable state must remain truthful and fail closed.

### Batch F — Settings / AI & Media Providers

- Settings stays secondary.
- AI Providers and Media Providers preserve the approved information architecture.
- Media overview is capability-first: Image / Video / Voice / Music / Avatar.
- Open-source/open-weight defaults appear first where configured; third-party/BYOK/custom/self-hosted options are alternatives/fallbacks.
- Credentials, endpoint URLs, model IDs and diagnostics remain behind Manage/advanced disclosure.
- Provider usage/limits only render when actual data exists.
- Integrations remains excluded/deferred.

## Approved discrepancy cleanup

Remove or hide normal-user entry points for the following while preserving backend/domain lineage where required:

- legacy Create workflow;
- Discover/Hunter;
- internal Ideas/research worklists;
- Research dossier;
- Claims/classification machinery;
- Angles/candidate-angle machinery;
- Campaign management as a normal creator destination;
- legacy Content Studio;
- Truth Gate;
- Critic scores/finding codes;
- asset/render/version IDs;
- account-group/routing authority/destination-set machinery;
- Pilot Operations/diagnostic automation internals;
- Format Intelligence internals;
- raw accountRef/provider IDs/OAuth scopes;
- raw published-post IDs/learning-object internals;
- malware/quarantine/ingestion jargon in normal Brand flows.

Progressive disclosure is permitted only for provenance/history, evidence supporting a warning/recommendation, advanced provider settings, and authorized specialist diagnostics.

## Per-page conformance matrix

Every page PR/batch must include a table with these columns:

| Approved requirement | Source/reference | Implementation location | Desktop evidence | Mobile evidence | State/interaction evidence | Verdict |
|---|---|---|---|---|---|---|

A row cannot be PASS from source inspection alone; it requires rendered evidence.

## Verification loop — mandatory for every batch

1. Read exact approved reference and control/state contract.
2. Implement using shared tokens/components first.
3. Run deterministic typecheck/tests for touched code.
4. Render authenticated desktop target.
5. Render authenticated mobile target.
6. Compare against approved reference for hierarchy, spacing, typography, controls, icons, borders, radii, density and copy.
7. Exercise loading, empty, ready, processing, success, needs-attention and failed states that are genuinely applicable.
8. Exercise keyboard/focus/touch/responsive behaviour.
9. Run UI Review.
10. Produce a discrepancy report with severity: Blocker / Major / Minor.
11. Correct Blocker/Major findings in one bounded pass.
12. Perform one confirmation screenshot pass.

No open-ended visual-polish loop is allowed.

## Screenshot fidelity gate

A page cannot be marked complete when any of these remain:

- wrong page hierarchy;
- wrong navigation or page label;
- duplicated Brand identity;
- missing approved control;
- added unapproved control/card/dashboard section;
- incorrect primary/secondary action hierarchy;
- different preview destination behaviour;
- technical/internal vocabulary exposed;
- desktop-only design squeezed onto mobile;
- invented data/state;
- rejected visual variant reintroduced.

Minor anti-aliasing/font-renderer differences are acceptable only when the same approved font, weight, line-height, spacing and layout geometry are used.

## Regression protection

After a page passes:

- add/refresh deterministic screenshot regression coverage where repository tooling supports it;
- add targeted interaction/state tests for critical behaviour;
- keep approved reference SHA/fingerprint immutable;
- any future screenshot diff touching a frozen page must be reviewed as design drift unless tied to an explicit approved reopening.

## Final end-to-end certification

Run the approved primary flow end to end:

Home → My Idea / For You → Content generation → Render → Preview → optional Presenter → Approve & Lock → Publish now / Schedule for later → Calendar/provider settlement → Published → Insights → future recommendation/Brand learning.

Also verify:

- Brand inline edit and source/channel recovery flows;
- AI/Media provider readiness and fallback states;
- cross-Brand isolation remains unchanged;
- no hidden technical destination has reappeared in creator navigation;
- truthful unavailable/failed states across real provider conditions;
- desktop and mobile screenshot evidence for every frozen surface.

## Release rule

Passing tests and a clean build are necessary but not sufficient. Readiness requires:

- governance validation;
- preflight;
- UI Review;
- screenshot/conformance evidence;
- exact-SHA certification approval;
- separate exact-SHA release approval;
- separate production-enable approval;
- rollback readiness for medium/high-risk release.

No autonomous merge or deployment.

## Execution state

- Branch created: `ui/approved-fidelity-implementation-2026-08-25`.
- This first commit is documentation/contract only.
- Runtime code must not begin until a dedicated active UI-fidelity slice is recorded because `delivery/current-slice.json` is still VS-90 in post-release observation and its approved requirements do not authorize the product-wide UI fidelity scope.
