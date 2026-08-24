import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("VS-89 Brand UI contract", () => {
  it("uses Brand terminology and the approved user-facing section structure", () => {
    const page = read("app/brands/[brandId]/brain/page.tsx");

    expect(page).toContain('pageLabel="Brand"');
    expect(page).toContain('Identity');
    expect(page).toContain('Audience');
    expect(page).toContain('Voice & Style');
    expect(page).toContain('Content Pillars');
    expect(page).toContain('Sources');
    expect(page).toContain('Channels');
    expect(page).not.toContain('Review & Control');
    expect(page).not.toContain('Brand Brain</');
  });

  it("keeps ordinary Brand editing inline with local Save and Cancel", () => {
    const editor = read("app/brands/[brandId]/brain/inline-brand-field.tsx");
    const compatibility = read("app/brands/[brandId]/brand-brain-control/page.tsx");

    expect(editor).toContain('setEditing(true)');
    expect(editor).toContain('setEditing(false)');
    expect(editor).toContain('>Cancel</button>');
    expect(editor).toContain('>Save</button>');
    expect(compatibility).toContain('/brain');
    expect(compatibility).not.toContain('textarea');
  });

  it("separates Sources from authenticated Channels", () => {
    const brand = read("app/brands/[brandId]/brain/page.tsx");
    const channels = read("app/brands/[brandId]/channels/page.tsx");

    expect(brand).toContain('Sources are evidence used to understand the Brand. Publishing destinations are managed separately in Channels.');
    expect(channels).toContain('Publishing &amp; Insights destinations');
    expect(channels).toContain('getChannelAccounts');
    expect(channels).toContain('getMetaConnectionHealth');
    expect(channels).toContain('connectionStartPath');
    expect(channels).not.toContain('grantedScopes');
    expect(channels).not.toContain('tokenExpiresAt');
    expect(channels).not.toContain('appId');
  });

  it("keeps account groups progressive and inside Brand Channels language", () => {
    const groups = read("app/brands/[brandId]/channels/groups/page.tsx");
    const channels = read("app/brands/[brandId]/channels/page.tsx");

    expect(channels).toContain('Advanced routing');
    expect(channels).toContain('/channels/groups');
    expect(groups).toContain('← Channels');
    expect(groups).toContain('Brand · Channels');
    expect(groups).not.toContain('Content Studio');
    expect(groups).not.toContain('Performance</Link>');
  });
});
