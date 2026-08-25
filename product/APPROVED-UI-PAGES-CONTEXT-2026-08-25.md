---
title: Kairo Approved UI Pages Context
status: Approved and frozen visual context
owner: Product Design
last_updated: 2026-08-25
scope: Approved visual pages, frozen references, discrepancy treatment, and remaining Settings work
implementation_authority: product/DESIGN.md + explicit user approvals
---

# Kairo approved UI pages — frozen set — 2026-08-25

This document freezes the visual pages explicitly approved by the user during the 2026-08-25 Kairo redesign discussion. Approved pages must not be regenerated, reinterpreted, or replaced unless the user explicitly reopens that page.

This is design authority/context only. Runtime implementation still follows repository governance, approved requirements/slices, security, certification, release, and production-enable gates.

## Locked Kairo Design DNA

- Deepika-style editorial/content hierarchy.
- shadcn-admin-style interaction discipline and clean controls.
- Tremor-lite analytics only where charts/metrics genuinely improve comprehension.
- Inter typography throughout.
- White / quiet-neutral dominant surfaces.
- Restrained Kairo purple for selected state and primary actions.
- Thin neutral borders, soft low-contrast elevation, generous whitespace.
- Consistent rounded cards and controls.
- One consistent outline-icon family; no emoji or mixed icon families.
- Graphs use thin, quiet lines and restrained semantic colour; never fabricate metrics.
- Technical/provider/agent/research/critic/render/version details stay under the hood unless a specialist disclosure genuinely needs them.
- User-facing page structure: shared shell/context → page title → short tagline → page content.
- Desktop and mobile use the same design DNA, adapted for density and interaction.
- Approved = frozen. `Go next` means move to the next unapproved page only.

## Approved and frozen pages

### 1. Home — APPROVED MASTER / FROZEN
Reference SHA-256: `f5cb932ce51ec47692565b91d38d5b86d307dfabbb5a6af6201980ceb3e3e433`

- One Brand identity in shell only.
- Page title `Home` + tagline `What needs you, what to create next, and what Kairo is handling.`
- Needs Attention: one dominant actionable issue, no semantic duplicates, simple Retry/Fix.
- My Idea: text + URL + Photo + Video + Media + `Get recommendations`.
- Kairo recommends format before creating.
- For You: thumbnail, format badge, save/bookmark, title, rationale, impact, fit, View all.
- What's working: Reach, Saves, Shares, Engagement rate, period selector, truthful sparklines.
- Primary navigation: Home / Content / Calendar / Insights / Brand.
- No Research, Hunter, Angles, Campaign, Critic, Claims, provider or workflow machinery.

### 2. Content list — APPROVED / FROZEN
Reference SHA-256: `80841cfffd4b538fbd1505a744e21af3ee3da5db316385997b9f19519182f016`

- Page title `Content` + tagline.
- Search, filters, optional list/grid control.
- All / Needs you / Ready / Scheduled / Published; Drafts only where truthful/needed.
- Thumbnail-led rows, format, channel, simple status, useful timing context.
- One contextual action per item.
- Published items may show a quiet performance hint/sparkline.
- No raw version/render/campaign IDs or technical lineage.

### 3. Content preview/detail — APPROVED / FROZEN
Reference SHA-256: `dc2c7e18486c242f90b759eb8d108bd5cade594afcf3534294a67e4ee576728c`

- Back to Content.
- Content title + concise context.
- Platform/channel tabs for selected destinations.
- Large exact platform-aware preview is the focal point.
- Edit / AI assistance / Replace media / Preview remain secondary.
- `Approve & Lock` dominant.
- Publish now primary after approval; Schedule later secondary.
- Details/history may disclose provenance/version detail.
- No Truth Gate, Critic, render IDs, asset IDs, raw workflow vocabulary.

### 4. Calendar — APPROVED / FROZEN
Reference SHA-256: `7349ef07fa922d4fe9018ac87f902022fc03ff7bf47cd62d8516c6b772662e0a`

- Page title `Calendar` + tagline.
- Today/date navigation/date range.
- Week primary desktop view; Month secondary.
- Filters.
- Calm schedule grid + optional agenda/details.
- Cards show thumbnail, channel, time, title, simple status.
- States: Scheduled / Publishing / Published / Needs attention.
- Failed items use `Fix`.
- No attempt counters, dispatch/reconciliation jargon.
- Item opens exact content item.

### 5. Insights — APPROVED / FROZEN
Reference SHA-256: `ab4b6d50612a8a2f1e9c0ce99f856cf3d67cacead188f323b5354d8033003280`

- Page title `Insights` + tagline `See what's working, why, and what to do next.`
- What happened → Why it may have happened → What to try next.
- Date/filter controls.
- Compact truthful summary metrics and quiet sparklines.
- One meaningful trend chart rather than dense dashboard clutter.
- Evidence-backed explanations and ranked next actions.
- Channel comparison/top content only with real data.
- No raw post IDs, learning object states, candidate/accepted engine terminology or experiment machinery.

### 6. Brand — APPROVED MASTER / FROZEN
Reference SHA-256: `969e87c6b9cf2372a39c6abf0a831b9aee3a5b0530e86bcbcf2de469b38b94d3`

Use the cleaner profile-style Brand page; discard later dashboard/card-grid variants.

- Page title `Brand` + tagline `Shape how Kairo understands and represents your brand.`
- Brand summary: logo/avatar, name, category/audience, Confirmed / AI inferred.
- Inline: Identity, Audience, Voice & Style, Content Pillars, Sources, Channels, Avatar.
- Local inline editing.
- Sources inline with simple health + Refresh/Manage.
- Channels inline; platform/account + simple state + one action.
- Avatar compact row links to dedicated Avatar page.
- No Brand Health dashboard card unless explicitly reopened.
- No accountRef, OAuth scopes, provider IDs, routing or sync internals.

### 7. Avatar (Presenter) — APPROVED AND FROZEN
Reference SHA-256: `9ccbf8605814b509ab5a4b6b2df98ba2a1abfe014bd48f579d6f67112d5e548f`

- Dedicated page linked from Brand.
- Title `Avatar (Presenter)`; do not regenerate.
- Tagline: optional presenter Kairo can use in videos.
- Back to Brand.
- Large preview + truthful `Not ready yet` when provider unavailable.
- Benefits: realistic presenter, Brand aligned, consistent delivery.
- `Set up avatar provider` callout → Settings.
- Four steps: Configure → Create → Review → Use.
- Kairo recommends: Style, Voice, Language, Framing, Background, Mode, Customize.
- `Create & Save` primary; `Test clip` secondary.
- Help/best practices.
- No raw provider credentials/infrastructure.

### 8. Settings → AI & Media Providers → AI Providers — APPROVED AND FROZEN
Reference SHA-256: `e63fee138fc3776c31a849b491fb25cfbdc91c0a9a97c5314559b386b80a6db3`

- Page title `AI & Media Providers` + tagline.
- Guidance banner: open-source first; third-party/BYOK/custom/self-hosted as alternatives/fallbacks.
- AI Providers / Media Providers tabs.
- Default AI provider: Ollama (Open Source), Connected · Healthy, Manage.
- Alternatives: OpenAI, Azure OpenAI/BYOK, Anthropic Claude, Custom Provider/self-hosted.
- Not connected + Connect states.
- Add provider.
- Secrets/credentials only inside secure provider management, never overview.

### 9. Settings → AI & Media Providers → Media Providers overview — APPROVED AND FROZEN
Reference SHA-256: `ffec62ebb613b8bbb45660540dfef4144bfbcb755e82961dc8b56e71dd133391`

Capability-first overview:

- Image — FLUX.1 Schnell — Ready — Manage.
- Video — Wan 2.2 — Ready — Manage.
- Voice — Kokoro — Ready — Manage.
- Music — ACE-Step — Ready — Manage.
- Avatar — MuseTalk — Needs attention — Manage.
- Custom / self-hosted — Add provider.
- Provider catalogs and technical detail stay behind Manage.

### 10. Manage Image Provider — APPROVED AND FROZEN
Reference SHA-256: `eb156b5ff2a635517e873321986633fd14d28b0504bea9c4886b33ccc3b4df92`

- FLUX.1 Schnell current/default provider.
- Ready state.
- Change provider.
- Model, aspect ratio, image quality, style, safety level.
- Advanced settings disclosed/collapsed.
- Usage & limits only when real provider data exists.
- Test provider / Generate test image.
- No fake usage/pricing at runtime; screenshot numbers are visual placeholders only.

### 11. Manage Video Provider — APPROVED AND FROZEN
Reference SHA-256: `aa838e1b18657564ae7048b9bbd9dc64b9f2b70a786c96cb7e96224e32d2716c`

- Wan 2.2 current/default provider.
- Connected · Healthy / Ready state.
- Capabilities: text-to-video, image-to-video, editing, effects/transitions, resolution, batch where supported.
- Provider configuration and preferences.
- Alternatives: Runway, Pika Labs, Luma Dream Machine.
- Custom/self-hosted provider.
- Test connection / Change provider.

### 12. Manage Voice Provider — APPROVED AND FROZEN
Reference SHA-256: `4a4848fc7dab52e0e24d1e5f974ef17ad13660b80439e42dc9ac7ea1620819c4`

- Kokoro current/default provider.
- Connected · Healthy / Ready state.
- Capabilities: text-to-speech, natural voices, voice cloning, emotions/tone, languages where genuinely supported.
- Preferences: voice, language, speed, style, format.
- Alternatives: OpenAI TTS, Azure Speech, ElevenLabs.
- Custom/self-hosted provider.
- Test connection / Change provider.

## Discrepancy treatment already approved for later implementation

### Hide from normal creator UI

- legacy Create workflow;
- Discover/Hunter;
- internal Ideas worklist/research states;
- Research dossier;
- Claims and claim classifications;
- Angles/candidate-angle machinery;
- Campaign management as a normal creator destination;
- legacy Content Studio;
- Truth Gate;
- Critic/critic score/finding codes;
- asset IDs/render IDs/version IDs;
- Account Groups/routing authority/destination-set machinery;
- Pilot Operations and diagnostic/automation internals;
- Format Intelligence contracts;
- raw accountRef/provider IDs/OAuth scopes;
- raw published-post IDs/learning-object internals;
- malware/quarantine/internal ingestion jargon in normal Brand flows.

### Progressive disclosure only when useful

- provenance/version/history;
- evidence supporting warnings or recommendations;
- advanced provider settings;
- specialist diagnostics for authorized operator/admin surfaces.

### Must remain visible to users

- My Idea URL / Photo / Video / Media controls;
- For You recommendations;
- Needs Attention, deduplicated;
- Approve & Lock;
- Publish now / Schedule later;
- truthful publishing failures/actions;
- Confirmed / AI inferred;
- channel connection state;
- provider Ready / Needs attention / Not configured inside Settings;
- Avatar provider blocker and Go to Settings when provider setup is required.

## Explicitly rejected / do not use

- Regenerated Brand variants after the cleaner approved profile-style Brand page.
- Regenerated Avatar variants after the frozen Avatar page.
- Accidental Content screens generated while Settings work was requested.
- Dense provider-usage dashboards not explicitly approved.
- Provider overview variants replacing the frozen AI Providers / Media Providers information architecture.
- Any generated page that was not explicitly approved or was superseded by a later explicit approval.

## Remaining unapproved Settings/design work

### Media-provider capability subpages

1. **Manage Music Provider — NEXT.**
2. Manage Avatar Provider / Avatar provider connection configuration.
3. Add Custom / self-hosted Provider flow.

### AI-provider specialist subflows still not explicitly approved

4. Manage default AI provider / Ollama configuration, if a dedicated page is required.
5. Connect/Add AI provider flow for OpenAI / Azure OpenAI / Anthropic / custom endpoint; prefer one reusable pattern rather than separate bespoke screens.

### Main Settings navigation pages

6. General.
7. Team.
8. Billing.
9. Notifications.
10. Integrations.
11. Security.
12. Audit log.

These are not approved merely because they appear in Settings navigation. Design and approve each separately.

## Implementation sequence after all pages are frozen

1. Shared Design DNA/tokens/components + typography/icons.
2. Shared shell normalization.
3. Home + discrepancy cleanup.
4. Content list/detail/preview + hide legacy Campaign/Research/Critic/render internals.
5. Calendar.
6. Insights.
7. Brand + inline Sources/Channels + Avatar link.
8. Avatar.
9. Settings + AI/Media Providers.
10. Remove/hide normal-user entry points to legacy/internal UX while preserving required backend/domain lineage.
11. Mobile/desktop accessibility/responsive/screenshot fidelity gate.

## Resume point

**Next unapproved page: Settings → AI & Media Providers → Manage Music Provider.**
