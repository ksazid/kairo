---
name: impeccable
description: Bounded frontend refinement for Kairo product UI, onboarding, empty states, responsive behavior, accessibility, hierarchy, UX copy, error states, motion polish, and design-drift correction.
source: https://github.com/pbakaus/impeccable/tree/56f44523f76efdcec813e67b38ee550e49b16f48/.github/skills/impeccable
source_commit: 56f44523f76efdcec813e67b38ee550e49b16f48
upstream_version: 4.1.1
license: Apache-2.0
---

# Impeccable — Kairo integration

Use this skill only after Kairo's approved requirements, active slice, `product/DESIGN.md`, and incumbent tokens/components are understood. Those sources remain authoritative.

## Role in Kairo

- Refine an already-approved product surface without silently changing product behavior.
- Improve visual hierarchy, spacing, typography, responsive behavior, accessibility, UX copy, empty/error/loading states, and bounded interaction polish.
- Use `onboard` principles for first-run activation, `adapt` for responsive behavior, `harden` for production edge cases, and `polish` for the final bounded pass.
- Treat Kairo application surfaces as **Operate** mode: task clarity, scanability, consistency, and native expectations outrank decoration.

## Required workflow

1. Read `product/DESIGN.md`, the active slice, the target UI, and at least one representative incumbent token/component before editing.
2. Preserve the approved Kairo visual world unless a separately approved design decision explicitly replaces it.
3. Keep the brief and product truth intact; never invent factual claims or expand scope during visual refinement.
4. Implement the full bounded change, then inspect desktop and mobile together in one batched pass.
5. Fix findings in one batch and perform at most one confirmation pass. Do not enter an open-ended polish loop.
6. Respect `prefers-reduced-motion`, keyboard access, semantic structure, contrast, and touch-target requirements.
7. Run Kairo UI Review and repository preflight before readiness claims.

## Kairo constraints

- No decorative AI glow, gradient-heavy dashboard treatment, excessive cards, or visual noise that conflicts with the approved design baseline.
- Do not make onboarding feel like a technical wizard when Kairo can infer the answer.
- Motion must explain state, continuity, feedback, or progress; ornamental motion is out of scope.
- Existing components and CSS/native platform features are preferred over new dependencies.

## Conflict rule

Repository governance, approved product/design decisions, security controls, Brand isolation, publishing authority, and accessibility requirements override this skill. Stop rather than silently resolving an authority conflict.
