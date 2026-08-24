---
title: Kairo Design Approval Log
document_id: CIE-DESIGN-APPROVALS-001
status: Approved
owner: Product Design
last_updated: 2026-08-24
applies_to:
  - CIE-DESIGN-001
---

# Kairo Design Approval Log

This file records explicit product-design approvals that extend the current approved Kairo design baseline. These decisions are implementation constraints until folded into the next version of `product/DESIGN.md`.

## Previously approved baseline retained

- Home design and information hierarchy remain approved.
- Authenticated shell/navigation remains approved.
- Desktop primary navigation remains five destinations.
- Mobile bottom navigation remains five destinations.
- Onboarding flow remains unchanged: public Brand URL / Instagram source → Kairo learns → concise Brand confirmation → Home.

## Content — mobile

**Status: Approved**

- Page title: `Content` with compact contextual search/filter access.
- Filters: `All`, `Needs you`, `Ready`, `Scheduled`, `Published`.
- Main surface is a clean single-column vertical list of Smart Items, not a card-grid dashboard.
- Each item may show a useful thumbnail/icon, title, limited format/channel metadata, status and one obvious primary action.
- Primary action is state-aware: `Continue`, `Review`, `Publish`, `View`, or `See results`.
- Secondary/uncommon actions live under `•••`.
- `Needs you` may use a restrained warning treatment.
- No large decorative colour blocks, gradients, KPI walls or nested-card clutter.
- Empty state is minimal and may direct the user to create from Home.
- Mobile page spacing follows the approved design system; touch targets remain comfortably usable.

## Calendar — mobile

**Status: Approved**

- Mobile defaults to a clean agenda/week experience rather than squeezing a desktop month grid onto phone width.
- Header includes `Calendar` with compact `Today` and filter controls.
- Current week is represented by a compact date strip.
- Scheduled content is shown chronologically and grouped by day.
- Calendar items may show time, useful thumbnail/type, title, channel and status.
- Tap opens item detail; secondary actions such as reschedule/edit/cancel use contextual overflow.
- `Needs attention` uses restrained warning treatment.
- Month view, if available, is secondary rather than the default mobile view.
- A create/floating action is shown only if Calendar genuinely supports creation; it must not duplicate or redefine the approved Home creation model.

## Results renamed to Insights

**Status: Approved**

- User-facing destination name changes from `Results` to `Insights`.
- `Insights` is the preferred label in primary navigation, mobile bottom navigation, page titles and user-facing copy.
- Existing technical/internal identifiers may remain temporarily for compatibility, but new user-facing work should use `Insights`.

### Insights — mobile direction

- Header: `Insights` plus compact date-range/filter control.
- Lead with a concise performance summary rather than a wall of KPI tiles.
- Primary narrative structure:
  1. `What happened`
  2. `Why it happened`
  3. `What to do next`
- Use only one or two compact charts where they materially improve understanding.
- Channel/content breakdowns should use restrained expandable/detail surfaces rather than dashboard clutter.
- Strong-performing content appears as a clean ranked list when useful.
- Contextual actions may include `Create similar`, `Use insight`, and `View content`.

## Brand — mobile

**Status: Approved**

- Header: `Brand` with compact edit/action access.
- Lead with a concise Brand summary including relevant identity, category, positioning and audience information.
- Organize the page into:
  - Identity
  - Audience
  - Voice & Style
  - Content Pillars
  - Sources
- Sources such as Website and Instagram show connection state, health, last synchronization and appropriate refresh/reconnect actions.
- User-confirmed information and Kairo-inferred information must be distinguishable where material.
- Editing uses focused sheets/forms instead of exposing many simultaneous inline controls.
- Provider-specific adapter/token/permission detail remains progressively disclosed.

## Brand learning after onboarding

**Status: Approved**

The onboarding flow must remain unchanged. Kairo may calculate confidence while learning from Instagram, website and other available Brand evidence, but must not add extra Brand-learning questions to onboarding.

### Confidence model

- Kairo calculates confidence for inferred Brand fields such as Identity, Audience, Voice & Style, Content Pillars, Positioning and related Brand knowledge.
- High-confidence information does not generate unnecessary questions.
- Medium-confidence information may generate an optional Home action.
- Low-confidence but non-blocking information may generate a stronger Home recommendation.
- Only information that genuinely blocks safe progress may appear in `Needs Attention`.

### Home Brand-learning action

Brand-learning questions appear later on Home as an actionable Smart Item, for example `Help Kairo know your Brand better` / `Improve Brand`.

- Questions are presented progressively, preferably one at a time.
- Completing an answer updates Brand knowledge/confidence.
- The interaction must remain quick and optional unless the missing information genuinely blocks safe work.

### Question interaction rule

**All Brand-learning questions are option-based by default.**

- Use single-select or multi-select depending on the question.
- Do not require free-text entry as the normal interaction.
- Include `None of these` and/or `Other` where appropriate.
- A short text field may appear only after the user explicitly chooses `Other` when free text is necessary.
- Confirmation questions can present Kairo's inferred options with preselected choices for quick correction.
- Optimize for one or two taps per question wherever possible.

Examples of approved question types include:

- primary audience selection;
- desired audience action such as Buy, Book, Visit, Message, Sign up, or Follow/engage;
- Brand-character selection such as Premium, Affordable, Expert-led, Friendly, Innovative, or Community-focused;
- confirmation/editing of inferred Content Pillars using selectable options.

## Implementation rule

These approvals refine responsive behaviour and user-facing terminology without changing Kairo's approved calm, minimalist, content-first design language. Implementation must preserve the approved shell, Home hierarchy, onboarding simplicity, progressive disclosure and one-obvious-action interaction model.