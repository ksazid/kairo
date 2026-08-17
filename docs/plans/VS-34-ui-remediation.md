# VS-34 — UI Remediation Implementation Plan

## Authority

- `AGENTS.md`
- `product/PRD.md`
- `product/TRD.md`
- `product/DESIGN.md`
- `docs/slices/VS-34.md`
- `.agents/skills/ui-ux-pro-max/SKILL.md`
- `.agents/skills/ui-review/SKILL.md`
- `.agents/skills/using-superpowers/SKILL.md`
- `.agents/skills/slice-planner/SKILL.md`
- `.agents/skills/implementer/SKILL.md`
- `.agents/skills/verifier/SKILL.md`

## Implementation steps

1. Add one shared Kairo product-shell component for the bounded authenticated pages.
   - Centralize desktop and mobile navigation labels/hrefs.
   - Accept explicit active destination and Brand/Workspace context.
   - Preserve the existing five-item mobile IA.
2. Refactor Today to use the shared shell.
   - Keep authentication/workspace/Brand resolution unchanged.
   - Move ranked Opportunities directly below the page header.
   - Keep the three-item cap.
   - Move Brand switching and recommendation-system explanation into a secondary details/context surface.
3. Refactor Discover to use the shared shell.
   - Keep data fetching and Opportunity actions unchanged.
   - Replace the three-count dashboard-like summary with one low-noise context line.
4. Tighten Opportunity card semantics.
   - Use page-appropriate heading hierarchy.
   - Keep status text and action authority unchanged.
5. Add/adjust bounded CSS in `discovery.css` for hierarchy and responsive collapse.
6. Add deterministic navigation-model tests where the route model is pure/testable.
7. Run UI review against the approved baseline, including desktop/tablet/mobile, keyboard/focus, status semantics, empty/error content and overflow.
8. Run repository deterministic checks and fix only slice-scoped regressions.

## Explicit exclusions

- Do not redesign Campaigns, Content Studio, Performance, Brand Brain or Operations in VS-34.
- Do not change Opportunity domain/API contracts.
- Do not add dependencies.
- Do not deploy or merge autonomously.

## Verification focus

- Navigation route correctness and active-state semantics.
- No regression to Today three-Opportunity cap.
- No regression to Develop/Save/Ignore server actions.
- Brand switching remains reachable.
- No horizontal page overflow at mobile widths.
- Primary action scarcity remains intact.
- `product/DESIGN.md` hierarchy is visibly improved: content before dashboard/context.
