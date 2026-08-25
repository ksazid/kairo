import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("VS-91 frozen Brand Channels contract", () => {
  it("keeps the approved Channels title, tagline and Brand return path", () => {
    const page = read("app/brands/[brandId]/channels/page.tsx");
    expect(page).toContain("<h1>Channels</h1>");
    expect(page).toContain("Connect the accounts Kairo can publish to and use for results.");
    expect(page).toContain("← Back to Brand");
  });

  it("keeps user-language connection states and real actions", () => {
    const page = read("app/brands/[brandId]/channels/page.tsx");
    expect(page).toContain('"Reconnect required"');
    expect(page).toContain('"Connected"');
    expect(page).toContain(">Reconnect</Link>");
    expect(page).toContain(">Manage</summary>");
    expect(page).toContain(">Disconnect</button>");
    expect(page).toContain(">Connect</Link>");
  });

  it("does not expose routing, account references or connection internals as UI", () => {
    const page = read("app/brands/[brandId]/channels/page.tsx");
    expect(page).not.toContain("Destination reference");
    expect(page).not.toContain("Advanced routing");
    expect(page).not.toContain("Manage account groups");
    expect(page).not.toContain("provider-backed Insights");
    expect(page).not.toContain("Brand source sync");
    expect(page).not.toContain("OAuth scopes");
  });

  it("keeps a compact responsive account list", () => {
    const css = read("app/brands/[brandId]/channels/channels-v2.css");
    expect(css).toContain(".channels-v2-row,.channels-v2-connect-row{display:grid");
    expect(css).toContain("@media(max-width:640px)");
    expect(css).toContain(".channels-v2-row,.channels-v2-connect-row{grid-template-columns:1fr");
  });
});
