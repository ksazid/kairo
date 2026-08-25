# VS-91 implementation plan — Frozen UI conformance program

## Authority

1. Latest explicit Product Owner approval for the affected surface.
2. `product/DESIGN.md`.
3. `product/UI-IMPLEMENTATION-CONTRACT-2026-08-25.md`.
4. Frozen approval-context files for the affected page.
5. Existing implementation only as a starting point.

## Execution sequence

### Batch 0 — Foundation and shell

1. Verify design-token values; add semantic aliases only where necessary.
2. Audit the authenticated shell against the frozen desktop/mobile contract.
3. Remove unapproved persistent shell UI while preserving routes/auth/data behavior.
4. Tighten shell CSS isolation and responsive rules.
5. Add deterministic tests for exact navigation/order, utility controls and prohibited shell elements.
6. Establish desktop/mobile visual evidence viewports and evidence manifest.

### Batch 1 — Home and Content

1. Audit current Home against the approved master.
2. Implement Home sections and hierarchy using truthful data/unavailable states.
3. Audit and implement Content list/workspace against frozen status/search/filter/item-action rules.
4. Implement Preview/Detail with destination-aware platform tabs, platform-aware preview composition, `Approve & Lock`, Publish now/Schedule later states, and progressive details/history disclosure.
5. Record missing behaviors in the Functionality Gap Register instead of altering UI.

### Batch 2 — Calendar and Results

1. Conform Calendar to the re-approved Week/Month/Agenda contract; keep Agenda first-class and mobile agenda-first.
2. Conform Results/Insights to What happened / Why / What next; use only real metrics and truthful unavailable states.

### Batch 3 — Brand

1. Conform Brand to the frozen profile-style master, not the rejected dashboard variant.
2. Conform inline Sources and Channels states/actions.
3. Conform dedicated Avatar (Presenter) page and truthful provider-not-ready state.

### Batch 4 — Providers

1. Conform AI Providers overview.
2. Conform Media Providers overview.
3. Conform Manage Image / Video / Voice / Music / Avatar provider surfaces.
4. Conform Custom / Self-Hosted provider surface.
5. Keep secrets/technical internals behind specialist management and never fabricate readiness/usage.

### Batch 5 — Settings

Implement General → Team → Billing → Notifications → Security → Audit log from the latest approvals. Integrations remains excluded.

### Batch 6 — Program verification

1. Typecheck/test/build.
2. Governance/preflight.
3. Desktop/mobile/tablet screenshots.
4. Dark/light sweep.
5. Accessibility/keyboard/touch-target sweep.
6. Evidence matrix per surface.
7. Functionality-gap reconciliation.
8. Design-drift correction before certification readiness.

## Constraints

- Do not redesign frozen pages.
- Do not add dependencies unless strictly necessary.
- Do not implement registered functionality gaps before Milestone A.
- Do not fake provider, billing, publishing, analytics, connection or source-health states.
- Do not expose internal workflow jargon in normal flows.
- Do not touch protected API/worker/release/infrastructure paths.
- Do not merge or deploy autonomously.

## Initial discrepancy findings

- Existing `KairoProductShell` rendered `ProductGuide` globally; frozen shell does not. Removed.
- Existing primary navigation displayed `Insights` for the `Results` destination; frozen shell uses `Results`. Corrected while retaining compatibility page semantics where appropriate.
- Approved shell isolation already exists via `k-shell-*` selectors and should be strengthened rather than replaced.
- Approved core token values are already present in `packages/design-tokens/tokens.css`; avoid unnecessary token churn.
- Legacy global shell selectors remain for older/non-auth surfaces but must not override authenticated `k-shell-*` chrome.

## Evidence discipline

Each frozen surface receives an evidence row with approved requirement, implementation location, desktop evidence, mobile evidence, state/functionality note and PASS/FAIL verdict. A green compile/test result alone is insufficient for frozen UI certification.
