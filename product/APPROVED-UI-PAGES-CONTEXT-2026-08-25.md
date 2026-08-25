---
title: Kairo Approved UI Pages Context
status: User-approved conversation context
owner: Product Design
last_updated: 2026-08-25
scope: Approved visual pages and continuation context only
implementation_authority: product/DESIGN.md + explicit user approvals
---

# Kairo approved UI pages — 2026-08-25

This note captures the pages explicitly approved by the user during the 2026-08-25 Kairo visual redesign discussion. It is a continuation/context document, not runtime implementation approval and not a substitute for repository governance.

## Locked design DNA

Use the same visual DNA on every user-facing Kairo page:

- Deepika-style editorial/content hierarchy.
- shadcn-admin-style interaction discipline and clean controls.
- Tremor-lite analytics only where charts/metrics genuinely improve comprehension.
- Kairo product rules remain authoritative for workflow, truthfulness, progressive disclosure, human approval and navigation.
- Inter typography throughout.
- White / quiet-neutral dominant surfaces.
- Restrained Kairo purple for selected state and primary actions.
- Thin neutral borders, soft low-contrast elevation, generous whitespace.
- Consistent rounded cards and controls.
- One consistent outline-icon family; no emoji or mixed icon families.
- Graphs use thin, quiet lines and restrained semantic colour; never fabricate metrics.
- Technical/provider/agent/research/critic/render/version details stay under the hood unless a specialist disclosure genuinely needs them.
- User-facing page structure is consistent: shell/context -> page title -> short tagline -> page content.
- Do not regenerate an approved page unless the user explicitly reopens it.

## Locked page-title pattern

Every primary page uses a visible page title and one short tagline directly beneath it.

Examples approved in the discussion:

- Home — “What needs you, what to create next, and what Kairo is handling.”
- Content — “All your content in one place. Track, review and publish.”
- Calendar — “See what’s scheduled, publishing, and already live.”
- Insights — “See what’s working, why, and what to do next.”
- Brand — “Shape how Kairo understands and represents your brand.”

## Approved pages

### 1. Home — APPROVED MASTER

The approved Home is the master visual reference for the redesigned product DNA.

Required composition and controls:

1. Shared Brand/page header with one Brand identity only; do not repeat the Brand name again as a page hero or scope card.
2. Page title `Home` + approved tagline.
3. `Needs attention` section:
   - one dominant actionable item;
   - no duplicate notifications for the same underlying problem;
   - simple user-facing action such as Retry/Fix.
4. `My idea`:
   - large idea text field;
   - URL;
   - Photo;
   - Video;
   - + Media / existing media;
   - primary `Get recommendations` action;
   - Kairo recommends the best format before creating anything.
5. `For you`:
   - horizontal recommendation cards;
   - useful thumbnail;
   - format badge such as Carousel/Reel/Post;
   - bookmark/save;
   - title;
   - concise rationale;
   - impact indicator;
   - fit indicator;
   - `View all`.
6. `What’s working`:
   - period selector;
   - Reach;
   - Saves;
   - Shares;
   - Engagement rate;
   - compact trend/sparkline where real data exists.
7. Primary navigation remains Home / Content / Calendar / Insights / Brand.

Do not expose Research, Hunter, Angles, Campaign machinery, Critic, Claims or provider mechanics on Home.

### 2. Content list — APPROVED

Approved desktop/list composition:

- Page title `Content` + tagline.
- Search.
- Filters.
- List/grid view control only when useful.
- Status tabs in user language: All / Needs you / Ready / Scheduled / Published. Drafts may appear where product state genuinely requires it.
- Thumbnail-led content rows.
- Format badge.
- Channel/platform identity.
- Truthful user-facing status.
- Last-updated/schedule information only where useful.
- One contextual primary action per item: Review / Publish / View / See results.
- Published items may include a subtle sparkline/performance hint.
- No raw version IDs, render IDs, campaign IDs or technical lineage in the list.

### 3. Content preview/detail — APPROVED

Approved content-preview direction:

- Same Kairo shell/DNA.
- Back to Content.
- Content title + concise supporting context.
- Channel/platform tabs for selected destinations only.
- Large platform-aware visual preview as the focal point.
- Carousel/Reel/Post preview should resemble how the content will actually appear on that destination.
- Edit / Replace media / AI assistance actions remain secondary to the preview.
- `Approve & Lock` is the dominant approval action.
- `Publish now` primary after approval; `Schedule later` secondary.
- Caption/presenter controls remain clear and simple.
- `Details & history` can hold provenance/version detail under disclosure.
- Do not expose Truth Gate, Critic, render IDs, asset IDs or internal workflow vocabulary in the normal preview.

### 4. Calendar — APPROVED

Approved Calendar direction:

- Page title `Calendar` + tagline.
- Today / navigation / date range.
- Week as the primary desktop view; Month secondary.
- Filters.
- Calm weekly schedule grid on desktop.
- Content cards show thumbnail, channel, time, title and simple status.
- Side agenda/details may summarize selected dates.
- States use user language: Scheduled / Publishing / Published / Needs attention.
- Failed items use a simple `Fix` action.
- No attempt counters, dispatch internals or reconciliation jargon.
- Tapping an item opens that exact content item.

### 5. Insights — APPROVED

Approved Insights direction:

- Page title `Insights` + tagline.
- Date-range/filter control.
- `What happened` first: a compact set of real performance highlights.
- Quiet sparklines on summary metrics.
- One meaningful trend chart rather than dashboard clutter.
- `Why it may have happened`: concise evidence-backed explanations.
- `What to try next`: ranked actionable recommendations with impact labels.
- Channel comparison and top-performing content may appear when real data exists.
- No fabricated analytics.
- No raw post IDs, learning-object internals, candidate/accepted engine terminology or experimentation machinery in the normal flow.

### 6. Brand — APPROVED MASTER

The user explicitly preferred the cleaner profile-style Brand page over later dashboard-style variants. Do not replace it with the card-grid/health-dashboard alternative.

Approved composition:

- Page title `Brand` + tagline.
- Brand summary with logo/avatar, Brand name, concise category/audience context and `Confirmed` / `AI inferred` indicators.
- Inline/profile sections:
  - Identity;
  - Audience;
  - Voice & Style;
  - Content Pillars;
  - Sources;
  - Channels;
  - Avatar.
- Identity/Audience/Voice/Pillars use clean local edit controls.
- Sources stay inline with simple health and Refresh/Manage.
- Channels stay inline on Brand; normal users do not need a separate Channels page.
- Channel row shows platform/account + simple state + one action (Manage / Reconnect / Connect).
- Do not show accountRef, OAuth scopes, provider IDs, routing details or sync internals.
- Avatar stays as a compact Brand row and links to its own dedicated page.
- Do not add a Brand Health dashboard card unless reopened by the user.

### 7. Avatar (Presenter) — APPROVED AND FROZEN

The exact user-selected Avatar page is approved. Do not regenerate it unless the user explicitly asks.

Approved characteristics:

- Dedicated page linked from Brand.
- Title is `Avatar (Presenter)` in the latest explicitly approved screenshot.
- Tagline: create an optional presenter Kairo can use in videos.
- `Back to Brand` control.
- Large avatar/presenter preview with truthful `Not ready yet` state when provider is unavailable.
- Simple benefits: realistic presenter, Brand aligned, consistent delivery.
- Explicit provider setup callout:
  - `Set up avatar provider`;
  - explains that provider must be configured in Settings;
  - `Go to Settings` action.
- `How avatar creation works` four-step explanation: Configure -> Create -> Review -> Use.
- `Kairo recommends` panel:
  - Style;
  - Voice;
  - Language;
  - Framing;
  - Background;
  - Mode;
  - Customize.
- `Create & Save` primary action.
- `Test clip` secondary action.
- Help/best-practices panel.
- Provider credentials or raw infrastructure never appear on this page.

### 8. Settings → AI & Media Providers → AI Providers tab — APPROVED AND FROZEN

The exact user-selected page is approved. Do not regenerate it unless explicitly reopened.

Approved structure:

- Settings context/breadcrumb.
- Page title `AI & Media Providers`.
- Short tagline describing management of AI/media providers used by Kairo.
- Quiet guidance banner: Kairo uses open-source providers by default; third-party, BYOK, custom and self-hosted providers can be alternatives/fallbacks.
- Tabs: `AI Providers` and `Media Providers`.
- Approved AI Providers tab:
  - `Default AI provider` section;
  - Ollama (Open Source) shown as default and `Connected · Healthy`;
  - Manage action;
  - `Alternative AI providers` section;
  - OpenAI;
  - Azure OpenAI / BYOK;
  - Anthropic Claude;
  - Custom Provider / self-hosted endpoint;
  - simple `Not connected` states and Connect actions;
  - `Add provider`.
- Provider credentials and raw secret values remain behind provider management; never displayed in the overview.

## Explicitly NOT approved / discard

The following generated directions must not be treated as approved references:

- Any regenerated Brand page after the cleaner approved profile-style Brand page.
- Any regenerated Avatar page after the user explicitly froze the selected `Avatar (Presenter)` page.
- The accidental Content page generated when the next requested page was `Media Providers`.
- Any Settings page that replaces the approved AI Providers page with a different information architecture without explicit approval.
- Dense provider-usage dashboards or unrelated provider cards that were generated but not explicitly approved.

## Remaining Settings work — CONTINUE HERE

The user asked to pause and resume the remaining Settings pages later.

Immediate next screen to design:

1. `Settings → AI & Media Providers → Media Providers` tab.

Expected capability-first structure, still subject to user approval:

- Image
- Video
- Voice
- Music
- Avatar / Presenter

For each capability:

- current/default provider;
- simple state: Ready / Needs attention / Not configured;
- Manage;
- open-source default first where configured;
- third-party / BYOK / custom / self-hosted choices behind Manage.

Likely subsequent Settings pages visible in the approved Settings navigation and still requiring design/approval:

2. General
3. Team
4. Billing
5. Notifications
6. Integrations
7. Security
8. Audit log

Do not assume these are approved merely because they appear in the Settings navigation; each remaining page should be designed and approved one by one.

## Implementation constraints to preserve later

- Do not implement from an unapproved generated page.
- The approved page body and control inventory should be treated as visual reference; implementation must still preserve real backend capability and truthful states.
- No fake metrics, fake provider readiness, fake Connected states or fake publication states.
- Existing technical/domain objects may remain underneath, but normal user flows must not expose Research/Angles/Campaign/Truth Gate/Critic/render/version/provider internals unless progressively disclosed for a real specialist need.
- Use shared design tokens/components before page-specific styling so the same typography, spacing, icons, cards, states and graphs remain consistent across the whole application.
- Final implementation should include screenshot-fidelity review at desktop and mobile sizes before the UI program is considered complete.

## Resume instruction

When this work resumes, do not regenerate any page marked `APPROVED` or `APPROVED AND FROZEN` above. Start directly with:

**Settings → AI & Media Providers → Media Providers tab**

and continue the remaining Settings pages one by one, requesting/receiving explicit approval for each screen before moving to the next.
