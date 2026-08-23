---
name: emil-design-eng
description: Purposeful interaction and motion guidance for Kairo UI. Use selectively for feedback, state transitions, progress, spatial continuity, and first-run delight where motion improves clarity.
source: https://github.com/emilkowalski/skills/tree/d23d7f88a2e21c9e4b1418c7abe420f5c1052ba7/skills/emil-design-eng
source_commit: d23d7f88a2e21c9e4b1418c7abe420f5c1052ba7
---

# Emil Design Engineering — Kairo integration

Kairo uses Emil Design Engineering selectively. Product clarity and the approved design baseline win over animation for animation's sake.

## Motion decision rules

1. Ask whether the interaction should animate at all. Frequent navigation and repeated actions should be instant or nearly instant; rare onboarding and state transitions may use restrained delight.
2. Every animation must serve one of: spatial continuity, state indication, explanation, immediate feedback, or preventing a jarring change.
3. Enter/exit UI should normally use a responsive ease-out. On-screen movement may use ease-in-out. Hover/color transitions may use ease. Avoid ease-in for user-triggered UI.
4. Keep ordinary UI motion under 300ms. Button press feedback should be about 100–160ms; small transitions roughly 125–200ms; onboarding/state panels about 180–260ms.
5. Pressable controls should feel responsive, typically with a subtle active scale around `0.97` where it does not disturb layout or accessibility.
6. Never animate from `scale(0)`. Prefer small translation/opacity or scale from roughly `0.95` when scale is justified.
7. Prefer CSS transitions and native browser behavior for interruptible product UI before introducing animation dependencies.
8. Honor `prefers-reduced-motion` by removing non-essential movement and leaving state changes immediately understandable.

## Kairo onboarding application

- URL submission: immediate button feedback and a calm transition into the learning state.
- Learning state: subtle verified progress/state changes; no theatrical AI animation.
- Confirmation: short opacity/translate entrance to establish continuity.
- Success/Home handoff: concise transition only; no confetti or blocking celebration.
- Frequent primary navigation: no ornamental transition.

## Conflict rule

The approved Kairo design baseline, accessibility, performance, and active-slice requirements override this skill. Motion is removed when it adds latency, distraction, or ambiguity.
