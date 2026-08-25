---
title: Kairo Approved Settings UI Context
status: User-approved conversation context
owner: Product Design
last_updated: 2026-08-25
scope: Approved/frozen Settings provider-management screens and continuation point
implementation_authority: product/DESIGN.md + explicit user approvals
---

# Kairo approved Settings UI — 2026-08-25

This note records Settings screens explicitly approved and frozen by the user. It is design context only, not runtime implementation approval.

## Frozen rule

- Once a screen is marked APPROVED AND FROZEN, do not regenerate or replace it unless the user explicitly reopens it.
- `Go next` means move only to the next unapproved screen.
- Use the same locked Kairo DNA: Inter typography, white/quiet-neutral surfaces, restrained Kairo purple, thin neutral borders, soft low-contrast elevation, generous whitespace, rounded controls/cards, one consistent outline-icon family, and progressive disclosure for technical details.

## Approved and frozen provider-management screens

### Manage Image Provider — APPROVED AND FROZEN

- Settings → AI & Media Providers → Image Provider.
- Current/default provider: FLUX.1 Schnell.
- Truthful Ready / Connected · Healthy state when configured.
- Provider capabilities shown as simple supported capability tiles.
- Provider configuration/preferences kept on this specialist Settings page.
- Alternative providers and Custom / self-hosted provider available below.
- User explicitly approved the selected generated reference and instructed that it be frozen.

### Manage Video Provider — APPROVED AND FROZEN

- Settings → AI & Media Providers → Video Provider.
- Current/default provider: Wan 2.2.
- Truthful Ready / Connected · Healthy state when configured.
- Video capabilities shown as supported capability tiles.
- Specialist configuration/preferences, alternative providers, and Custom / self-hosted provider available on this Settings page.
- User explicitly approved and froze the selected generated reference.

### Manage Voice Provider — APPROVED AND FROZEN

- Settings → AI & Media Providers → Voice Provider.
- Current/default provider: Kokoro.
- Truthful Ready / Connected · Healthy state when configured.
- Voice capabilities shown as supported capability tiles.
- Specialist voice preferences, alternative providers, and Custom / self-hosted provider available on this Settings page.
- User explicitly approved and froze the selected generated reference.

### Manage Music Provider — APPROVED AND FROZEN

- Settings → AI & Media Providers → Music Provider.
- Current/default provider: ACE-Step.
- Truthful Ready / Connected · Healthy state when configured.
- Music capabilities shown as supported capability tiles.
- Specialist music preferences, alternative providers, and Custom / self-hosted provider available on this Settings page.
- User explicitly approved and froze the selected generated reference.

### Manage Avatar / Presenter Provider — APPROVED AND FROZEN

- Settings → AI & Media Providers → Avatar Provider.
- Current/default provider: MuseTalk in the approved design reference.
- `Needs attention` is shown truthfully when provider configuration is incomplete.
- Provider capabilities shown as supported capability tiles.
- Specialist configuration/preferences, alternative Avatar providers, and Custom / self-hosted provider available on this Settings page.
- This is provider infrastructure Settings; it is distinct from the separate approved Brand → Avatar (Presenter) creation page.
- User explicitly approved and froze the selected generated reference.

## Continue here

Next unapproved Settings screen:

**Settings → General**

Then continue one by one only after explicit approval:

1. General
2. Team
3. Billing
4. Notifications
5. Integrations
6. Security
7. Audit log

Do not regenerate any frozen provider-management screen while progressing through these pages.
