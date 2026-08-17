# VS-52 UI remediation plan

## Design authority

`product/DESIGN.md` remains authoritative. The implementation must feel like the same calm Kairo product introduced through VS-50/VS-51, not a separate redesign system.

## Step 1 — Campaigns hierarchy

- replace page-local/Ideas-owned navigation with `KairoProductShell`;
- retain Brand scope as secondary context;
- present Campaigns as one primary list surface;
- make New Campaign a deliberate disclosure instead of a permanent right-hand panel;
- preserve selected-Angle eligibility and existing create server action.

## Step 2 — Studio writing hierarchy

- replace page-local sidebar/mobile nav with `KairoProductShell`;
- keep Campaign objective and exact review status concise;
- make the editor a full-width primary work surface;
- move AI transforms into a contextual disclosure below the editor;
- move version history + evidence lineage into a second contextual disclosure.

## Step 3 — Review and approval hierarchy

- keep current review status visible without opening anything;
- put detailed Truth Gate/Critic findings behind an inspectable disclosure;
- keep review/re-review action visible when action is required;
- keep destination-specific approval visible after review passes;
- make optional account-group distribution progressively disclosed;
- keep approved destination record and scheduling/manual-publish fallback visible after approval.

## Step 4 — Responsive/accessibility

Desktop:
- wide editor-first Studio;
- secondary context expands below the editor rather than alongside it.

Tablet:
- support/history content stacks to one column;
- header context remains readable and secondary.

Mobile:
- one continuous vertical flow;
- no horizontal page scroll;
- create disclosure becomes inline;
- editor remains usable with reduced minimum height;
- actions wrap or scroll only locally where needed.

Accessibility:
- shared skip link/main target;
- semantic section headings;
- text-labelled review states;
- visible input labels;
- native `details/summary` keyboard semantics for progressive disclosure;
- no hover-only required actions.

## Verification

- compare branch against merged VS-51 `main`;
- confirm no server action/API/domain/database files changed;
- Product Intake exact-head pass;
- Security exact-head pass;
- full CI/preflight/runtime/dashboard build pass;
- implementation-level UI Review PASS;
- rendered desktop/tablet/mobile + keyboard/focus validation when an approved browser-capable exact-candidate environment is available.
