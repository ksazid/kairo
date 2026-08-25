---
title: Kairo Frozen UI Implementation Contract
status: Approved implementation preparation baseline
owner: Product Design / Engineering
last_updated: 2026-08-25
scope: Frozen Kairo UI surfaces, execution rules, and functionality-gap tracking
implementation_authority:
  - product/DESIGN.md
  - explicit user approvals
  - this contract for UI-first execution and gap tracking
---

# Kairo Frozen UI Implementation Contract — 2026-08-25

## Purpose

This contract prepares the approved/frozen Kairo UI for implementation without reopening design decisions.

The implementation objective is design conformance, not redesign. The latest explicit user-approved version of each surface is authoritative. Rejected, superseded, exploratory, accidental, or older variants must not be used.

## Mandatory UI-first rule

A missing or unavailable backend capability MUST NOT defer or block implementation of an approved UI surface.

When an approved UI depends on functionality that is not yet available:

1. implement the approved UI and responsive states now;
2. keep the UI truthful — do not fabricate success, connected, published, healthy, billing, analytics, or provider states;
3. use the approved unavailable / not configured / empty / disabled / needs-attention state where applicable;
4. record the missing behaviour in the Functionality Gap Register in this document;
5. do not silently remove, redesign, simplify, or replace the approved control because its backend behaviour is missing;
6. after the complete frozen UI program is implemented and visually certified, implement the registered functionality gaps in a separate governed phase.

UI completion and functionality completion are therefore tracked separately.

## Authority and conflict order

For UI implementation, use this order when sources differ:

1. latest explicit user approval for the specific surface;
2. approved `product/DESIGN.md` visual and interaction baseline;
3. this implementation contract;
4. earlier approval-context documents;
5. existing implementation;
6. generated suggestions.

A later explicit approval supersedes an older approved variant for the same surface. Existing code never overrides a frozen approved design.

## Frozen UI inventory

The following surfaces are approved and frozen for UI implementation:

1. Home.
2. Content — List / Workspace.
3. Content — Preview / Detail.
4. Content — Destination-aware Social Preview states within Preview / Detail.
5. Calendar — latest explicitly re-approved version.
6. Insights / Results.
7. Brand — Overview / Brand Brain profile-style surface.
8. Brand — Sources / Website + Instagram source management states.
9. Brand — Channels / Connections states.
10. Avatar (Presenter).
11. Settings — AI Providers.
12. Settings — Media Providers.
13. Settings — General.
14. Settings — Team.
15. Settings — Billing.
16. Settings — Notifications.
17. Settings — Security.
18. Settings — Audit log.

### Excluded from the current UI implementation program

- Settings → Integrations remains deferred by explicit product decision and is not part of the frozen implementation inventory.

## Frozen interaction/state requirements

The following are part of the approved surfaces and are not optional implementation extras:

- `Approve & Lock` content approval flow and hierarchy.
- Destination-aware preview tabs for selected publishing destinations only.
- Dynamic Instagram / Reel / YouTube / LinkedIn preview availability based on actual selected destinations and content format.
- Platform-aware previews that resemble the final destination experience rather than generic media canvases.
- Publish-now and schedule-later states after approval.
- Provider Ready / Needs attention / Not configured / unavailable states as applicable.
- Brand source health, refresh, manage, reconnect, disconnect, replace, and failure states where approved.
- Channel connected / reconnect / connect states using user language.
- Responsive desktop/tablet/mobile behaviour consistent with `product/DESIGN.md`.
- Empty, loading, error, degraded, disabled, and unavailable states where required for truthful UI behaviour.
- Approved light/dark shell control and shared shell behaviour.

## Non-negotiable design-conformance rules

- Do not redesign frozen pages during implementation.
- Do not regenerate approved pages as a new interpretation.
- Do not reintroduce rejected variants.
- Do not invent controls, cards, dashboards, copy, gradients, navigation destinations, or provider machinery to fill space.
- Do not omit an approved control because the functionality behind it is not implemented.
- Do not expose Research, Hunter, Angles, Campaign, Critic, Truth Gate, render IDs, version IDs, provider IDs, OAuth scopes, routing internals, attempt counters, reconciliation jargon, or other implementation vocabulary in normal user flows unless an approved specialist disclosure requires it.
- Do not fabricate metrics or analytics.
- Do not fabricate provider readiness, account connection, publication status, billing status, audit records, source health, or successful actions.
- Use one Brand identity in the shell/page context; avoid duplicate Brand hero/scope treatments.
- Use shared design tokens and shared components before page-specific CSS.
- The authenticated shell is shared and cannot be restyled per page.
- Use one consistent outline-icon family.
- Preserve the approved page title + short tagline grammar.
- Preserve Inter typography, quiet/white-neutral surfaces, restrained Kairo purple, thin borders, restrained elevation, generous whitespace, and modest radii from the approved baseline.

## Implementation sequence

Implement in controlled batches so visual drift is caught early:

### Batch 0 — Baseline and shared system

- Confirm frozen reference set.
- Implement/normalize design tokens.
- Implement shared shell.
- Implement shared primitives and states.
- Establish visual-regression screenshot harness.
- Establish desktop and mobile comparison viewports.

### Batch 1 — Core product surfaces

- Home.
- Content list/workspace.
- Content Preview / Detail.
- Destination-aware social preview states.

### Batch 2 — Planning and intelligence

- Calendar.
- Insights / Results.

### Batch 3 — Brand surfaces

- Brand profile / Brand Brain.
- Sources states.
- Channels states.
- Avatar (Presenter).

### Batch 4 — Provider settings

- AI Providers.
- Media Providers.

### Batch 5 — Remaining settings

- General.
- Team.
- Billing.
- Notifications.
- Security.
- Audit log.

### Batch 6 — Whole-product visual certification

- Desktop visual sweep.
- Mobile visual sweep.
- Responsive/tablet sweep.
- Dark/light appearance check.
- Shared-shell consistency check.
- Cross-page typography/spacing/control consistency check.
- Interaction-state sweep.
- Functionality Gap Register reconciliation.

## Per-page definition of UI done

A frozen page is UI-complete only when all of the following pass:

- approved composition is present;
- approved controls are present;
- approved copy/hierarchy is preserved unless later explicitly changed;
- approved empty/loading/error/unavailable states are represented;
- desktop render is visually compared to the approved reference;
- mobile render is visually compared to the approved reference or approved responsive contract;
- shared shell and components remain consistent;
- no internal technical vocabulary leaks into the normal flow;
- no fake data/state is introduced;
- accessibility basics pass: labels, focus, keyboard path where applicable, semantics, contrast, touch targets;
- functionality gaps are recorded instead of hiding or removing UI;
- discrepancy review is PASS.

A compiling page is not automatically UI-complete.

## Visual discrepancy policy

Every implementation discrepancy must be classified as one of:

- `MATCH` — faithful to approved design.
- `RESPONSIVE_ADAPTATION` — necessary adaptation allowed by `product/DESIGN.md`; preserves hierarchy and meaning.
- `TRUTHFUL_STATE_ADAPTATION` — approved visual shown with a truthful unavailable/empty/not-configured state because real data or behaviour is unavailable.
- `FUNCTIONALITY_GAP` — UI is implemented but interaction/backend behaviour remains pending and is registered below.
- `DESIGN_DRIFT` — unexplained divergence from the frozen design; must be fixed before page certification.
- `CONFLICT` — authoritative sources conflict; stop only the affected target and resolve under repository governance.

`DESIGN_DRIFT` is never acceptable as a shortcut for missing functionality.

## Functionality Gap Register

This register is the durable backlog for behaviour that is unavailable during the UI-first phase. Add one row immediately when a missing capability is discovered.

| Gap ID | Surface | Approved UI/control already implemented | Missing functionality | Truthful interim behaviour | Dependency/owner | Status |
|---|---|---|---|---|---|---|
| FG-001 | Avatar (Presenter) | Provider setup / Create & Save / Test clip states | Avatar generation provider may be unavailable or unconfigured | Show approved `Not ready yet` / provider-setup state; never fake generation success | Media-provider integration | VERIFY DURING IMPLEMENTATION |

### Required status values

- `VERIFY DURING IMPLEMENTATION`
- `UI IMPLEMENTED — FUNCTION PENDING`
- `FUNCTION IMPLEMENTED — VERIFY`
- `CLOSED`

### Gap recording rules

- Record the exact page/control, not a vague feature name.
- Describe the missing behaviour precisely.
- Record what the UI does truthfully until behaviour exists.
- Never use a gap entry to authorize visual drift.
- Never mark a gap closed merely because the control renders.
- Do not implement registered functionality gaps until the frozen UI program is finished, unless a missing function is strictly required to render or test truthful UI state and repository governance permits it.

## Candidate capabilities to verify, not assumptions of absence

During implementation, explicitly verify whether these behaviours already exist before creating new gap IDs:

- destination-specific preview rendering and tab eligibility;
- publish-now / schedule-later wiring;
- Brand website source refresh/replace/disconnect;
- Instagram source connection, refresh, permissions/health, reconnect/disconnect;
- channel connect/manage/reconnect flows;
- media-provider capability routing for image/video/voice/music/avatar;
- Team invite/member/role management;
- Billing plan/subscription/payment-management actions;
- Notification preference persistence;
- Security settings actions and session/security state;
- Audit-log retrieval/filtering/pagination;
- real analytics feeding Home and Insights/Results.

These are verification targets only. Do not label them unavailable until repository/runtime inspection proves they are missing or incomplete.

## Evidence required per implementation PR

Each UI PR must include an evidence matrix with:

| Approved requirement | Implementation location | Desktop evidence | Mobile evidence | State/functionality note | Verdict |
|---|---|---|---|---|---|

Required verdict: `PASS` before UI certification.

Green unit/integration tests without visual evidence are insufficient for frozen-page certification.

## Testing gates

For each batch:

1. deterministic build/type/lint tests;
2. component/interaction tests where applicable;
3. accessibility checks;
4. desktop screenshots;
5. mobile screenshots;
6. visual comparison against frozen references;
7. functionality-gap reconciliation;
8. design-drift correction;
9. repository governance/preflight checks before readiness claims.

## Completion split

The program has two explicit milestones:

### Milestone A — Frozen UI Complete

All 18 frozen surfaces are implemented, responsive, truthful, visually certified, and any missing behaviours are fully captured in the Functionality Gap Register.

### Milestone B — Functionality Gaps Complete

After Milestone A, implement registered gaps in governed slices, preserving the already-certified UI. Each gap receives behaviour tests and end-to-end verification without redesigning its frozen surface.

## Stop conditions

Stop only the affected target when:

- authoritative repository sources conflict materially;
- implementing the UI would require fabricating a legal, security, billing, authorization, retention, or release policy;
- a missing security-sensitive behaviour cannot be represented truthfully with a disabled/unavailable state;
- repository governance disallows the required runtime modification.

Do NOT stop or defer UI solely because ordinary application functionality, data, provider wiring, analytics, publishing, billing integration, or similar behaviour is absent. Render the approved truthful UI state and register the gap.

## Final instruction

Implementation is a fidelity exercise. The approved design is the target; existing code is merely the starting point. Missing functionality becomes a registered follow-up, never an excuse to alter, omit, or postpone the frozen UI.
