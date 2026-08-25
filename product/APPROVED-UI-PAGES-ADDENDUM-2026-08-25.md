---
title: Kairo Approved UI Pages Addendum
status: User-approved conversation context
owner: Product Design
last_updated: 2026-08-25
scope: Additional frozen Settings pages approved after the primary context file
---

# Kairo approved UI pages — addendum

This file extends `product/APPROVED-UI-PAGES-CONTEXT-2026-08-25.md` on branch `design/approved-pages-context-2026-08-25`.

## Settings → AI & Media Providers → Manage Image Provider — APPROVED AND FROZEN

User approval reference: `https://chatgpt.com/s/m_6a8cf846bf6c8191b44a3c24d88e56d0`.

Treat the exact user-selected Manage Image Provider page as frozen. Do not regenerate it unless the user explicitly reopens it.

Approved characteristics:

- Same approved Kairo Settings shell and design DNA.
- Breadcrumb/context: Settings → AI & Media Providers → Manage Image Provider.
- Title: `Manage Image Provider`.
- Tagline: choose and configure the engine Kairo uses for image generation.
- Current provider section showing the selected/default image engine with truthful readiness state.
- Provider settings for model, aspect ratio, image quality, style, safety level, and advanced settings.
- Usage & limits section only when backed by real provider/account data.
- Test provider section with a test prompt/action to verify configuration.
- Provider secrets remain masked and securely managed; never expose raw credentials.
- Alternative provider selection/change remains available without exposing implementation internals in the normal overview.

## Next unapproved capability page

Continue with:

**Settings → AI & Media Providers → Manage Video Provider**

Use the Manage Image Provider page as the interaction/layout reference, adapted only for video-specific decisions such as model, aspect ratio, duration, resolution/quality, frame rate where supported, audio behavior where supported, safety, usage/limits, and a truthful test-generation action.
