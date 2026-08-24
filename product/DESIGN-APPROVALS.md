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

## Calendar — desktop refinement

**Status: Approved**

- Desktop defaults to a calm week view with `Today`, `Week`, `Month`, `Agenda` and compact Brand/channel/status filters.
- Scheduled and published content appears directly on the timeline using restrained content items rather than management-dashboard tiles.
- Selecting an item opens lightweight contextual detail rather than a second editor.
- Primary item actions are state-aware: `View content`, `Reschedule`, `Publish now` when eligible, and `Cancel schedule` where applicable.
- `Publishing`, `Published`, `Failed` and `Needs attention` remain explicit states.
- Content editing and channel preview remain inside Content/Preview rather than Calendar.

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

## Brand — mobile and web

**Status: Approved**

- Header: `Brand` with compact edit/action access.
- Lead with a concise Brand summary including relevant identity, category, positioning and audience information.
- Organize the profile into:
  - Identity
  - Audience
  - Voice & Style
  - Content Pillars
  - Sources
  - Channels
  - Avatar, when configured or being created
- Sources such as Website and Instagram show connection state, health, last synchronization and appropriate refresh/reconnect actions.
- User-confirmed information and Kairo-inferred information must be distinguishable where material.
- **Editing is inline-first.** Selecting an editable value turns that local field into an in-place editor with local Save/Cancel behaviour. Select/chip-based values stay inline. Focused sheets/forms are reserved for genuinely complex edits that need more space.
- Provider-specific adapter/token/permission detail remains progressively disclosed.

## Brand — Sources and Channels separation

**Status: Approved**

- `Sources` are inputs Kairo uses to learn the Brand.
- `Channels` are authenticated destinations Kairo uses for publishing and private/provider Insights.
- The same external account may support both purposes, but the UI must keep the concepts understandable without exposing adapter architecture.
- Channel rows show channel identity, selected account/page, connection state, available capabilities, last verification/sync when useful, and one obvious `Connect` or `Manage` action.
- `Connect` uses a focused OAuth/authorization flow, then destination selection only when multiple eligible destinations exist.
- `Manage` exposes account/page, publishing availability, Insights availability, connection health, refresh/reconnect/disconnect and progressively disclosed technical detail.
- Credentials, tokens, app IDs and raw scopes do not appear in the normal user flow.

## Brand — optional Avatar / Presenter

**Status: Approved**

- Avatar/Presenter is optional per Brand and is not a primary navigation destination.
- It lives as a Brand subpage/surface and does not add a separate content workflow.
- When no presenter exists, Brand may show a compact `Create avatar` action.
- Kairo should pre-suggest presenter style, voice, tone, framing, background and presentation mode from Brand context rather than requiring a long setup form.
- Avatar setup should preserve the four-click product principle for the normal happy path: Brand → Avatar → Create avatar → review/accept AI suggestions → Create & Save.
- A short test clip may be generated and reviewed on the same Avatar surface; it must not create a separate mandatory workflow.
- During `My Idea` / `For You`, a Presenter selector is shown only when the Brand has an eligible avatar. Default is `None`; Kairo may recommend the presenter when the content suits it, but must never force use.
- Presenter profile can retain visual identity/reference, voice, language/accent, pace, presentation style, framing, background preference, intro/outro behaviour, caption preference and provider binding.

## Preview, approval and publish/schedule interaction

**Status: Approved**

- Preview is one canonical Content Detail / Preview experience and remains content-first.
- Only channels selected for the content appear as preview tabs; a single-channel execution shows only that channel.
- Preview displays the exact final assets and exact channel-specific copy intended for publication, not a regenerated approximation.
- `Approve & Lock` is the dominant approval action; improving/regenerating is secondary.
- Approval freezes the exact per-channel asset/copy version and lineage used by deterministic publishing.
- `Publish now` is the primary post-approval action.
- `Schedule for later` is secondary and progressively disclosed on the same Preview surface rather than becoming a mandatory standalone page.
- Multi-channel scheduling uses one common time by default; `Set different times by channel` is an advanced/secondary option.
- The UI must not claim `Published` before provider settlement; use explicit `Publishing`, `Processing`, `Scheduled`, `Published` and `Failed` states.

## Settings — AI & Media Providers

**Status: Approved**

- Settings remains a secondary Profile/Settings utility and never expands primary navigation.
- `AI & Media Providers` is the main Kairo-specific provider configuration surface.
- The normal overview is capability-first rather than infrastructure-first: Image, Video, Voice, Music and Avatar.
- Each capability may show its default model/provider, readiness and one `Manage` action.
- Kairo supports managed providers plus optional custom/self-hosted endpoints.
- Custom/self-hosted setup may include capability, endpoint URL, adapter/API compatibility, model identifier, optional server-side credential, connection test, and whether the provider is default or fallback.
- Default and fallback providers are configuration, not hard-coded product behaviour.
- Technical credentials, model IDs, endpoint details and provider diagnostics remain progressively disclosed.
- Provider failures should produce clear user-facing recovery/fallback states rather than stack traces or infrastructure jargon.
- Initial open-source/open-weight presets may include FLUX.1 Schnell for image, Wan 2.2 for video, Kokoro for voice, ACE-Step for music, MuseTalk for avatar/presenter and FFmpeg/Remotion for composition; these are replaceable presets rather than permanent product policy.

## Notifications and deep links

**Status: Approved**

- Notifications remain part of the approved authenticated shell.
- Actionable notifications deep-link to the actual affected object or recovery surface rather than a generic notification destination.
- Examples include failed publish → affected Content/Preview, channel issue → Brand/Channels, scheduled content → Calendar item, and performance signal → relevant Insights/content context.

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

## Final end-to-end UI lock

**Status: Approved**

The primary experience is locked as:

```text
Home
  → My Idea / For You
  → Content generation
  → Render
  → Preview
  → optional Presenter
  → Approve & Lock
  → Publish now / Schedule for later
  → Calendar / provider settlement
  → Published
  → Insights
  → future recommendations and Brand learning
```

Supporting configuration remains:

```text
Brand
  → Identity / Audience / Voice & Style / Content Pillars
  → Sources
  → Channels
  → optional Avatar

Profile / Settings
  → AI & Media Providers
```

Primary user outcomes should remain within the PRD four-click principle where Kairo can safely perform the remaining work itself.

## Implementation rule

These approvals refine responsive behaviour and user-facing terminology without changing Kairo's approved calm, minimalist, content-first design language. Implementation must preserve the approved shell, Home hierarchy, onboarding simplicity, progressive disclosure and one-obvious-action interaction model.

`product/DESIGN.md` remains the visual authority. Repository design/implementation skills may improve accessibility, responsive behaviour, interaction quality and bounded polish, but may not replace the approved visual language or invent a new information architecture.
