import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const brandPage = readFileSync(resolve(root, "app/brands/[brandId]/brain/page.tsx"), "utf8");
const avatarPage = readFileSync(resolve(root, "app/brands/[brandId]/avatar/page.tsx"), "utf8");
const settingsPage = readFileSync(resolve(root, "app/settings/page.tsx"), "utf8");
const providersPage = readFileSync(resolve(root, "app/settings/ai-media-providers/page.tsx"), "utf8");
const deferred = readFileSync(resolve(root, "../../docs/plans/VS-95-deferred-interactions.md"), "utf8");

describe("VS-95 approved Brand, Avatar and Provider interaction contract", () => {
  it("wires supported Brand source and destination actions", () => {
    expect(brandPage).toContain('refreshInstagramBrandSourceAction.bind(null, brand.id, instagramSource.id)');
    expect(brandPage).toContain('type="submit">Refresh</button>');
    expect(brandPage).toContain('href={channelsHref}>Manage</Link>');
    expect(brandPage).toContain('href={channelsHref}>Channels</Link>');
    expect(brandPage).toContain('href={avatarHref}>Avatar</Link>');
    expect(brandPage).toContain('href="#sources">{brand.publicSourceUrl ? "Manage source" : "Add source"}</a>');
  });

  it("routes Avatar recommendations to real editable fields and exact-Brand provider settings", () => {
    expect(avatarPage).toContain('<h1>Avatar (Presenter)</h1>');
    expect(avatarPage).toContain('/settings/ai-media-providers?tab=media&brand=${encoded}#avatar-provider');
    expect(avatarPage).toContain('href="#presenter-style"');
    expect(avatarPage).toContain('href="#presenter-voice"');
    expect(avatarPage).toContain('href="#presenter-language"');
    expect(avatarPage).toContain('href="#presenter-framing"');
    expect(avatarPage).toContain('href="#presenter-background"');
    expect(avatarPage).toContain('href="#presenter-mode"');
    expect(avatarPage).toContain('id="presenter-style"');
    expect(avatarPage).toContain('id="presenter-mode"');
    expect(avatarPage).toContain('Create & Save');
    expect(providersPage).toContain('brands.find((item) => item.id === query.brand)');
    expect(providersPage).toContain('brandQuery');
  });

  it("keeps Avatar test rendering truthful until provider execution exists", () => {
    expect(avatarPage).toContain('type="button"');
    expect(avatarPage).toContain('disabled');
    expect(avatarPage).toContain('Test clip');
    expect(avatarPage).toContain('provider-backed test rendering is implemented and verified');
    expect(avatarPage).not.toContain('View help center');
  });

  it("links Settings to the approved provider overview and keeps unsupported writes disabled", () => {
    expect(settingsPage).toContain('href="/settings/ai-media-providers"');
    expect(providersPage).toContain('<h1>AI &amp; Media Providers</h1>');
    expect(providersPage).toContain('/settings/ai-media-providers?tab=ai${brandQuery}');
    expect(providersPage).toContain('/settings/ai-media-providers?tab=media${brandQuery}');
    expect(providersPage).toContain('id: "avatar-provider"');
    expect(providersPage).toContain('Configuration UI pending');
    expect(providersPage).toContain('Not configured');
    expect(providersPage).toContain('disabled');
    expect(providersPage).not.toContain('Connected · Healthy');
  });

  it("durably records approved controls that still need implementation", () => {
    expect(deferred).toContain('Website `Refresh`');
    expect(deferred).toContain('YouTube `Manage`');
    expect(deferred).toContain('`Test clip`');
    expect(deferred).toContain('Ollama `Manage`');
    expect(deferred).toContain('OpenAI `Connect`');
    expect(deferred).toContain('Manage Music Provider design is the next unapproved page');
  });
});
