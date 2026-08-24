# VS-88 Implementation Plan — Calendar + Insights

## Strategy
Implement UI-03 as a frontend-only presentation slice over existing calendar and performance contracts.

## Work plan
1. Extend the Calendar view model with deterministic Monday-first week parsing/building/range helpers while preserving month helpers.
2. Add regression tests for week boundaries, week navigation, truthful UTC grouping and filter stability.
3. Replace the legacy Calendar shell with `KairoProductShell`.
4. Make Week the default Calendar mode; keep Month and Agenda as explicit secondary modes.
5. Use an agenda-first responsive composition so mobile never depends on the month table.
6. Replace Campaign-facing Calendar links/copy with canonical Content routes and user language.
7. Refactor the existing Performance page into the approved Insights hierarchy without changing the `/performance` compatibility route or analytics APIs.
8. Remove channel connection management from Insights while retaining existing connection routes for the future Brand → Channels slice.
9. Add bounded CSS for Calendar/Insights rather than globally reinterpreting the design system.
10. Open a draft PR early for Product Intake, Security and CI; fix only exact-head failures within scope.
11. Freeze one candidate SHA, record exact verification evidence, mark review-ready, and stop before certification/merge unless explicitly approved.

## Design gates
- `product/DESIGN.md` and `product/DESIGN-APPROVALS.md` remain authoritative.
- Use the shared five-destination shell.
- No KPI-wall treatment, gradients, glow, glass, ornamental AI visuals or card-per-metric layouts.
- Calendar is planning/visibility, not a second editor.
- Insights uses evidence-backed narrative and never implies causation from correlation.
- Unavailable metrics remain unavailable.
- One obvious primary local action where action is needed.

## Runtime boundaries
No changes to `apps/api/**`, `apps/worker/**`, migrations, publishing worker, analytics collection, OAuth/token handling, provider adapters, tenant isolation, or release workflows.

## Verification
- repository preflight/governance
- workspace TypeScript checks
- web regression tests including new Calendar week tests
- existing API/worker/domain suites through CI
- Next.js production build and route manifest
- Product Intake
- Security baseline
- CI
