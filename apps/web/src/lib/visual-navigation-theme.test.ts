import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("approved product shell navigation and themes", () => {
  it("keeps a reusable accessible logo and one navigation icon family", () => {
    const icons = read("app/kairo-icons.tsx");
    const shell = read("app/kairo-product-shell.tsx");

    expect(icons).toContain("export function KairoLogo");
    expect(icons).toContain("export function KairoIcon");
    expect(shell).toContain("destinationIcons");
    expect(shell).toContain('aria-label="Primary navigation"');
  });

  it("supports only the approved persistent light and dark appearance states", () => {
    const toggle = read("app/theme-toggle.tsx");
    const layout = read("app/layout.tsx");
    const css = read("app/globals.css");

    expect(toggle).toContain('type Theme = "light" | "dark"');
    expect(toggle).toContain('localStorage.setItem("kairo-theme"');
    expect(toggle).toContain('<KairoIcon name="sun"');
    expect(toggle).toContain('<KairoIcon name="moon"');
    expect(toggle).not.toContain('"system"');
    expect(layout).not.toContain("kairo-sidebar-collapsed");
    expect(layout).not.toContain("kairo-density");
    expect(css).toContain(':root[data-theme="dark"]');
  });

  it("uses the operating-system reduced-motion preference", () => {
    const css = read("app/globals.css");
    const toggle = read("app/theme-toggle.tsx");

    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(toggle).not.toContain("reduced-motion");
  });

  it("provides Brand switching and compact mobile Brand context without legacy breadcrumb chrome", () => {
    const shell = read("app/kairo-product-shell.tsx");
    const switcher = read("app/brand-switcher.tsx");

    expect(shell).toContain("<BrandSwitcher");
    expect(shell).not.toContain('className="k-shell-breadcrumbs"');
    expect(shell).not.toContain("<ProductGuide");
    expect(shell).toContain('className="k-shell-mobile-header"');
    expect(shell).toContain('className="k-shell-mobile-page"');
    expect(shell).toContain("<ThemeToggle />");
    expect(shell).not.toContain("<ShellControls");
    expect(switcher).toContain("kairo-pinned-brands");
    expect(switcher).toContain("kairo-recent-brands");
  });

  it("keeps functional shell motion short and transform based", () => {
    const shellCss = read("app/shell-baseline.css");

    expect(shellCss).toContain("120ms var(--k-ease-out)");
    expect(shellCss).toContain("transform: scale(.98)");
    expect(shellCss).not.toContain("transition: all");
  });

  it("renders the approved five user-facing destinations without changing stable Results compatibility", () => {
    const shell = read("app/kairo-product-shell.tsx");
    const shellCss = read("app/shell-baseline.css");
    const navigation = read("src/lib/product-navigation.ts");

    expect(navigation).toContain('{ label: "Home", displayLabel: "Home"');
    expect(navigation).toContain('{ label: "Content", displayLabel: "Content"');
    expect(navigation).toContain('{ label: "Calendar", displayLabel: "Calendar"');
    expect(navigation).toContain('{ label: "Results", displayLabel: "Insights"');
    expect(navigation).toContain('{ label: "Brand", displayLabel: "Brand"');
    expect(shell).toContain("item.displayLabel");
    expect(shellCss).toContain("grid-template-columns: repeat(5, minmax(0, 1fr))");
    expect(shell).not.toContain("CommandPalette");
    expect(shell).not.toContain("density-toggle");
    expect(shell).not.toContain("sidebar-toggle");
    expect(shell).not.toContain("ShellControls");
    expect(shell).not.toContain("mobile-brand-bar");
  });

  it("normalizes legacy navigation helpers to the same five destinations and removes More", () => {
    const desktop = read("app/legacy-pilot-navigation.tsx");
    const mobile = read("app/pilot-mobile-nav.tsx");

    for (const label of ["Home", "Content", "Calendar", "Insights", "Brand"]) {
      expect(desktop).toContain(`label: "${label}"`);
      expect(mobile).toContain(`label: "${label}"`);
    }
    expect(mobile).not.toContain('{ label: "More"');
    expect(desktop).not.toContain('const items = ["Today"');
  });

  it("keeps Settings secondary under Profile and makes it a real route", () => {
    const profile = read("app/profile-menu.tsx");
    const settings = read("app/settings/page.tsx");

    expect(profile).toContain('href="/settings"');
    expect(profile).not.toContain("Settings</span><small>Later");
    expect(settings).toContain("<h1>Settings</h1>");
    expect(settings).toContain("<ThemeToggle />");
  });
});
