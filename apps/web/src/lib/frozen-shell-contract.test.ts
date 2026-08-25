import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  DESKTOP_PRODUCT_DESTINATIONS,
  MOBILE_PRODUCT_DESTINATIONS,
  buildProductNavigation,
  displayDestination,
} from "./product-navigation";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const approved = ["Home", "Content", "Calendar", "Results", "Brand"];

describe("VS-91 frozen product shell contract", () => {
  it("uses exactly the approved desktop and mobile destinations in order", () => {
    expect([...DESKTOP_PRODUCT_DESTINATIONS]).toEqual(approved);
    expect([...MOBILE_PRODUCT_DESTINATIONS]).toEqual(approved);
  });

  it("uses frozen user-facing labels without legacy Insights or More navigation", () => {
    const navigation = buildProductNavigation({ workspaceId: "workspace-1", brandId: "brand-1" });
    expect(navigation.desktop.map(item => item.displayLabel)).toEqual(approved);
    expect(navigation.mobile.map(item => item.displayLabel)).toEqual(approved);
    expect(navigation.desktop.map(item => item.label)).not.toContain("More");
    expect(navigation.mobile.map(item => item.label)).not.toContain("More");
    expect(displayDestination("Results")).toBe("Results");
  });

  it("keeps only the approved persistent account utilities in the shared shell", () => {
    const shell = read("app/kairo-product-shell.tsx");
    expect(shell).toContain("<NotificationCentre notifications={notifications} />");
    expect(shell).toContain("<ThemeToggle />");
    expect(shell).toContain("<ProfileMenu addBrandHref={addBrandHref} />");
    expect(shell).not.toContain("<ProductGuide />");
    expect(shell).not.toContain('from "./product-guide"');
  });

  it("preserves a five-column mobile nav and hides desktop breadcrumbs on mobile", () => {
    const css = read("app/shell-baseline.css");
    expect(css).toContain("grid-template-columns: repeat(5, minmax(0, 1fr));");
    expect(css).toContain(".k-shell-breadcrumbs {\n    display: none;");
  });
});
