# VS-57 Implementation Plan

## Design read
- Operations: internal operator task queue; user job is to resolve exceptions safely; medium density; Kairo specialist-workspace family.
- More: secondary navigation hub; user job is to reach less-frequent Brand/management work; low density; Kairo navigation/list family.

## Execution
1. Extend the shared product shell so secondary routes can intentionally have no desktop primary-nav selection while still resolving mobile `More`.
2. Add a pure Operations view model and deterministic tests for priority/order/retry/budget semantics.
3. Rebuild Operations around one attention queue, one quiet status strip and progressive disclosure for supporting operational controls.
4. Rebuild More as grouped row navigation using the shared shell and existing routes only.
5. Add responsive/accessibility CSS using Kairo tokens and native details/summary controls.
6. Run Product Intake, Security baseline, CI and implementation-level UI Review on a frozen exact candidate.

## State and responsive checks
- empty failures: calm “Nothing needs attention” state;
- failed read: existing safe error boundary remains;
- loading: existing redacted loading copy remains;
- partial supporting state: empty budgets/automation/audit sections remain truthful;
- desktop: persistent sidebar, no false primary selection on secondary routes;
- tablet: stack header/action rows and supporting forms;
- mobile: single-column flow, `More` selected, full-width important controls, no horizontal scroll;
- accessibility: skip link through shared shell, semantic headings, native disclosures, text state labels, progressbar semantics, visible global focus treatment, reduced-motion treatment.

## Non-goals
No runtime contract, API, database, provider, OAuth, publishing, scheduling, Vercel or deployment change.
