---
name: design-taste-frontend
description: Conditional anti-slop frontend direction for landing pages, marketing surfaces, portfolios, and redesigns. Do not use as the primary skill for dashboards, data tables, or multi-step product workflows.
source: https://github.com/ksazid/taste-skill/tree/main/skills/taste-skill
upstream: https://github.com/Leonxlnx/taste-skill
license: MIT
---

# Design Taste Frontend

This project-local integration routes suitable web UI work to Taste Skill v2 while preserving the repository's governing requirements, approved design baseline, accessibility rules, and active slice.

## Use when

- Building a landing page, marketing site, portfolio, campaign surface, or editorial page.
- Establishing visual language for a new customer-facing web surface.
- Auditing or redesigning an existing page where redesign is explicitly approved.
- The brief needs stronger layout, typography, spacing, hierarchy, motion direction, or anti-template discipline.

## Do not use as the primary skill when

- Building dashboards, dense data tables, operator/admin queues, or complex forms.
- Implementing multi-step product workflows where task clarity and accessibility dominate visual experimentation.
- The active slice does not permit visual redesign.
- An approved design baseline, reference screen, or design system already decides the visual direction and Taste guidance would conflict with it.

For those cases, use UI UX Pro Max for flow, states, responsiveness, forms, and accessibility; use Ponytail for implementation quality; use Impeccable for bounded polish; and use Emil principles only when purposeful motion is required.

## Required sequence

1. Read the PRD/TRD, active slice, approved design baseline, and existing design tokens.
2. State a one-line design read covering page type, audience, intended visual language, and design-system family.
3. Infer appropriate design variance, motion intensity, and visual density from the brief; do not force the upstream defaults.
4. Preserve established brand assets and existing visual authority on redesigns.
5. Use one coherent component/design system; do not mix incompatible systems.
6. Check dependencies before importing any package and prefer existing project dependencies.
7. Implement responsive, semantic, keyboard-accessible, reduced-motion-aware UI.
8. Run the project's UI review, accessibility, screenshot, and preflight checks before completion.

## Conflict rule

Repository governance and approved product/design sources always override this skill. Record a blocker instead of silently replacing an established visual identity or product behavior.

## Canonical installation/update

To install the complete upstream skill set in a compatible agent environment:

```bash
npx skills add https://github.com/ksazid/taste-skill --skill "design-taste-frontend"
```

The upstream v2 skill is experimental. Pin `design-taste-frontend-v1` only when a project explicitly requires the previous behavior.
