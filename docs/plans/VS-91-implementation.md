# VS-91 implementation plan — Frozen UI foundation and shared shell

## Authority

1. Latest explicit Product Owner approval for the affected surface.
2. `product/DESIGN.md`.
3. `product/UI-IMPLEMENTATION-CONTRACT-2026-08-25.md`.
4. Existing implementation only as a starting point.

## Execution steps

1. Verify design-token values and introduce semantic aliases only where they improve conformance without changing approved meaning.
2. Audit the authenticated shell against the frozen desktop/mobile contract.
3. Remove unapproved shell-level UI while preserving existing routing/auth/data behavior.
4. Tighten shell CSS isolation and responsive rules.
5. Add/extend deterministic tests for the exact five-destination navigation contract, mobile utility contract, accessibility semantics and prohibited items.
6. Inspect shared UI-state primitives for visual-token drift; change only shared primitives required by Batch 0.
7. Run type/build/test/governance/preflight checks available to the branch.
8. Capture desktop/mobile evidence in a later visual-verification step before certification.

## Constraints

- Do not redesign frozen pages.
- Do not add dependencies unless strictly necessary.
- Do not implement deferred functionality gaps.
- Do not fake provider, billing, publishing, analytics, connection or source-health states.
- Do not touch protected release/infrastructure paths.
- Do not merge or deploy autonomously.

## Initial discrepancy findings

- The existing `KairoProductShell` renders `ProductGuide` globally. The frozen shell contract allows the five primary destinations plus Notifications, light/dark and Profile/Settings persistent utilities; the global ProductGuide control is therefore design drift and should be removed from shared shell chrome.
- Approved shell isolation already exists via `k-shell-*` selectors and should be preserved/strengthened rather than replaced.
- Approved core token values are already present in `packages/design-tokens/tokens.css`; normalization should be minimal and avoid unnecessary token churn.
- Legacy global shell selectors remain in `globals.css`. They may continue to support legacy/non-auth surfaces, but must not override `k-shell-*` authenticated chrome.
