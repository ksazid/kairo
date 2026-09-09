# Kairo Mockup Design Authority Gate

**Status:** Approved and mandatory
**Scope:** Every Kairo UI mockup, redesign extension, page state, and visual change.
**Authority:** Kairo UI V2 only. Legacy Kairo is never a design authority.

## Purpose

No Kairo mockup may be generated from memory, generic design patterns, or the current implementation alone when an approved/frozen mockup exists.

For every page, the latest approved/frozen mockup is the primary visual authority. The current implemented V2 page is used to reconcile implementation reality and existing controls, not to silently replace the approved design.

## Mandatory authority order

Before every mockup, use this order and do not bypass it:

1. **Latest approved/frozen mockup for that exact page/state** — primary visual authority.
2. **Current `apps/kairo-ui-v2` implementation** — implementation/control authority.
3. **Approved Kairo global design DNA/tokens/components** — consistency authority.
4. **Approved new requirement** — extension scope only.

If multiple historical mockups exist, identify the latest approved/frozen version that led to or superseded the current V2 implementation. Do not use an older rejected/intermediate mockup.

## Gate 1 — Frozen mockup retrieval

Before generating any new mockup:

- locate the saved approved/frozen mockup artifact for the page,
- inspect it directly,
- identify its exact layout, terminology, controls, hierarchy, card/list/table structure, spacing, CTA placement, badges, filters, states and navigation,
- record which parts are frozen,
- do not rely on memory alone.

If the frozen artifact cannot be confidently identified, stop mockup generation and resolve the authority first.

## Gate 2 — Current V2 reconciliation

Inspect the current V2 implementation for the same page and compare it against the frozen mockup.

Classify each current element as:

- **MATCH** — consistent with frozen mockup; preserve.
- **IMPLEMENTATION DETAIL** — needed for working product but does not alter frozen design intent; preserve unless the approved requirement changes it.
- **DRIFT** — differs from frozen mockup without explicit approval; do not use the drift as authority for future mockups.
- **NEWLY APPROVED** — explicitly approved after the frozen mockup; include it.

## Gate 3 — No terminology drift

- Do not rename existing navigation items, section titles, filters, buttons, statuses, content types, badges, or control labels unless an approved functional requirement requires it.
- Add new terminology only for genuine extensions/additions that cannot logically reuse existing terminology.
- Styling preference is never sufficient reason to rename a control.

## Gate 4 — Strict minimum-change rule

Every new mockup must make the smallest possible change required to expose the approved capability.

Before adding anything, ask:

1. Can the requirement be satisfied with the existing page unchanged?
2. If not, can an existing property/value/state carry it?
3. If not, can an existing control be extended?
4. If not, can it be shown through progressive disclosure inside an existing component?
5. Only if all above fail may a new standalone control/component be proposed.

No unrelated cleanup, modernization, new CTA, extra filters, new navigation, or visual embellishment is allowed.

## Gate 5 — Existing-control extension rule

New capability must extend the control that already owns the same user decision.

Examples:

- New content format -> extend existing **Format** filter/options.
- New channel -> extend existing **Channel** selector.
- New opportunity status -> extend existing status/filter model where semantically correct.
- New Discover intelligence -> extend existing card/table row rather than add a parallel dashboard/widget.
- Additional details -> use existing Preview/detail flow rather than overloading the listing page.

A new control requires explicit justification that no existing control can logically represent the capability.

## Gate 6 — Logical user-control test

For every visible control/property in a proposed mockup verify:

- Does the user need this on this page?
- Does it help the next decision/action?
- Is this the smallest control surface that can express it?
- Does the same action/control already exist elsewhere on the page?
- Should this information live in Preview/detail instead?
- Is the terminology already established elsewhere in Kairo?

If a control fails this test, remove it before generation.

## Gate 7 — Do not add or remove silently

Before image generation, produce an explicit scope statement containing:

### Frozen / unchanged
All existing page areas, terminology, controls and layouts that will remain exactly as approved.

### Extension only
The exact approved additions/changes being introduced.

### Explicitly not changing
Any tempting but out-of-scope items such as navigation, CTA, filters, sorting, page hierarchy, terminology, or unrelated visual treatment.

No element outside **Extension only** may change in the generated mockup.

## Gate 8 — One page, one approval

- Generate only the current unapproved page/state.
- Do not regenerate frozen pages in comparison boards.
- Do not include unrelated pages.
- Do not move to the next page until the current mockup is approved and frozen.

## Gate 9 — Frozen means immutable

Once approved/frozen:

- do not regenerate it,
- do not reinterpret it,
- do not change terminology,
- do not change structure,
- do not reuse it as a canvas for unrelated experiments,
- do not add it to later design boards unless explicitly requested.

Reopening requires explicit user approval.

## Gate 10 — Schema alignment after visual approval

Every approved mockup must then pass `decisions/KAIRO-PAGE-SCHEMA-GATE.md` before implementation.

Sequence is mandatory:

**retrieve frozen design -> reconcile current V2 -> define minimal extension -> generate mockup -> approve/freeze -> create page/backend contract -> validate no duplicate schema/control -> approve/freeze contract -> implement later**

## Mandatory pre-generation checklist

Before every image-generation call, all answers must be **YES**:

- [ ] I located and inspected the latest approved/frozen mockup for this page/state.
- [ ] I verified it against the current V2 implementation.
- [ ] I know exactly which elements are frozen.
- [ ] I preserved all existing terminology unless explicitly approved otherwise.
- [ ] I reused/extended existing controls before considering new controls.
- [ ] I removed every proposed element that is not logically required from the user's point of view.
- [ ] I am making the minimum possible design change.
- [ ] I am not adding an unapproved CTA, filter, tab, status, menu, sorting control, navigation item, or metric.
- [ ] I am not removing an existing approved control/property.
- [ ] I stated Frozen / Extension / Explicitly-not-changing scope before generation.
- [ ] I am generating only this page/state.

If any item is **NO**, mockup generation is blocked.

## Final rule

**The approved/frozen mockup is the page's visual source of truth. The current V2 implementation may confirm or reveal implementation details, but it may not silently override the approved design. Every future mockup is an extension of the frozen design, never a fresh redesign.**
