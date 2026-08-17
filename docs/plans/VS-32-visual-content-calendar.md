# VS-32 implementation plan — Visual Content Calendar

## Governing sources

- `AGENTS.md`
- `product/PRD.md` FR-05, FR-10, FR-13, FR-14, FR-15
- `product/TRD.md`
- `product/DESIGN.md`
- active `delivery/current-slice.json`
- `.agents/skills/ui-ux-pro-max/SKILL.md`
- `.agents/skills/ui-review/SKILL.md`
- `.agents/skills/using-superpowers/SKILL.md`

## Existing foundation

The current Brand Calendar already reads deterministic publish commands, campaign names and connected accounts; it exposes truthful command state plus existing retry/cancel actions. VS-32 must reuse these contracts rather than inventing a second scheduling model.

## UX structure

### Desktop

1. Compact heading with month context and Content Studio action.
2. Calendar toolbar:
   - previous month
   - Today
   - next month
   - Campaign filter
   - Channel filter
   - Status filter
   - clear filters when active
3. Seven-column month grid with restrained day cells.
4. Each day cell summarizes a small number of items with time, channel, campaign and status text.
5. Below the grid, a filtered agenda shows full account/version/state plus existing retry/cancel actions.
6. Destination health becomes a compact secondary section rather than competing with the calendar as a permanent dominant panel.

### Tablet

- month grid remains seven columns where viable;
- toolbar wraps cleanly;
- destination health moves below agenda;
- no fixed side panel.

### Mobile

- compact month orientation remains available but does not force desktop-card density;
- agenda is the primary detailed interaction surface;
- filters wrap/stack with native selects;
- all actions remain keyboard/touch accessible;
- no horizontal page scrolling.

## State model

- Loading: skeleton/quiet loading surface using existing route loading boundary.
- Empty: no commands in the Brand; direct user toward Content Studio.
- Filtered empty: commands exist but none match filters; provide Clear filters.
- Error: preserve route error boundary.
- Scheduled/manual-required/dispatching/published/failed/unknown/cancelled: preserve exact textual state.
- Reconnect/disabled destinations: visible as destination health, not treated as successful automation.

## Implementation steps

1. Activate VS-32 and record allowed/protected paths plus standing implementation approval.
2. Add pure calendar view-model helpers for month parsing, grid construction and filter matching.
3. Add unit tests for month boundaries, combined filters and truthful grouping before page integration.
4. Refactor Calendar page to use URL-state month/filter controls and the new visual month grid.
5. Retain the chronological agenda and existing server actions for detailed interactions.
6. Refine `calendar.css` using existing Kairo tokens; no new design system or package dependency.
7. Update loading/empty states if required by acceptance criteria.
8. Run UI review against accessibility, responsive behaviour, state/content stress and the approved baseline.
9. Run repository preflight/runtime/dashboard verification and security/product intake gates.
10. Freeze exact SHA and stop for certification + merge approval.

## Test strategy

- pure view-model tests for 28/29/30/31-day months and leading/trailing grid days;
- query/filter tests for campaign/channel/status combinations and clear-state behavior;
- page/HTML assertions for accessible labels, Today navigation, filter controls and state text where supported by existing test harness;
- preserve existing publishing command/action tests;
- repository preflight, runtime verification and dashboard build.

## Safety

- No client credential access.
- No publishing command mutation except existing explicit retry/cancel actions.
- No automatic rescheduling or drag-drop mutation.
- No provider API changes.
- No deployment/release/production enablement.
