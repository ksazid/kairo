---
name: ui-ux-pro-max
description: Project-local integration for UI/UX Pro Max. Use for Kairo product information architecture, task flows, states, responsive behaviour, accessibility, interaction and UI quality control. The approved Kairo design baseline remains authoritative.
source: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
source_commit: a38d04c3d5c298c851dbe5e6ee1965ee3de42cb5
license: MIT
---

# UI UX Pro Max — Kairo integration

This project-local integration makes the approved UI UX Pro Max workflow explicit for Kairo UI work without replacing `product/DESIGN.md`.

## Authority

1. Read `AGENTS.md`, approved PRD/TRD, active slice and `product/DESIGN.md` first.
2. Kairo's approved design baseline, semantic tokens and existing component language override generic style recommendations.
3. Do not use this skill to reopen approved visual/product decisions silently.

## Apply when

Use for authenticated product workflows, dashboards, calendars, forms, navigation, state design, responsive behaviour, accessibility and interaction quality.

For landing/editorial/redesign-led surfaces, `design-taste-frontend` may supplement this skill, but it must not become the primary skill for dense product workflows.

## Priority checks

Apply these in order:

1. Accessibility: semantic structure, keyboard operation, visible focus, non-colour state communication, contrast and labels.
2. Touch and interaction: reachable controls, useful feedback, no hover-only actions, sufficient target sizes.
3. Performance: avoid layout instability and unnecessary client/runtime work.
4. Product-fit style: preserve Kairo's calm, minimal, content-first editorial workspace.
5. Responsive layout: progressive collapse, no horizontal page scrolling, clear mobile hierarchy.
6. Typography and colour: use Kairo tokens; avoid raw decorative colour and tiny body text.
7. Motion: restrained, purposeful, reduced-motion aware.
8. Forms and feedback: visible labels, local errors, clear loading/empty/error states.
9. Navigation: predictable route/context behaviour and accessible controls.
10. Data displays: accessible labels/legends and no colour-only meaning.

## Kairo workflow

For a new or materially changed product page:

- Write a one-line design read covering page type, user job, density and existing design family.
- Preserve the current design system and tokens rather than generating a conflicting new visual system.
- Define desktop, tablet and mobile behaviour before implementation.
- Define loading, empty, partial, error, permission/reconnect and success states where applicable.
- Prefer progressive disclosure over permanent side panels and control clutter.
- Keep primary actions scarce and obvious.
- Ensure keyboard and screen-reader use is possible for every required action.
- Run `ui-review`, responsive checks, accessibility checks and repository preflight before completion.

## Calendar-specific guidance

For scheduling/calendar work:

- Make time orientation obvious (today, current range, previous/next).
- Provide a visual calendar plus an accessible chronological representation where useful.
- Filters must be understandable, removable and preserve truthful state semantics.
- Do not rely on drag-and-drop as the only scheduling mechanism.
- Status, channel and destination must remain readable without colour alone.
- Compact cells may summarize; details/actions should be progressively disclosed.
- Mobile should use a focused agenda/range view rather than squeezing a desktop grid.

## Provenance

This integration is derived from UI UX Pro Max at source commit `a38d04c3d5c298c851dbe5e6ee1965ee3de42cb5`. Full upstream searchable datasets/scripts are not vendored here; repository authority and this bounded integration are sufficient for deterministic Kairo use. Update deliberately through reviewed provenance rather than floating to upstream `main`.
