import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  DESKTOP_PRODUCT_DESTINATIONS,
  MOBILE_PRODUCT_DESTINATIONS,
  buildProductNavigation,
  displayDestination,
} from "./lib/product-navigation";

const source = (relative: string) => readFileSync(new URL(relative, import.meta.url), "utf8");

const APPROVED_DESTINATIONS = ["Home", "Content", "Calendar", "Results", "Brand"];

describe("VS-91 frozen product shell contract", () => {
  it("uses exactly the approved desktop and mobile destinations in order", () => {
    expect([...DESKTOP_PRODUCT_DESTINATIONS]).toEqual(APPROVED_DESTINATIONS);
    expect([...MOBILE_PRODUCT_DESTINATIONS]).toEqual(APPROVED_DESTINATIONS);
  });

  it("uses the frozen user-facing labels without legacy Insights or More navigation", () => {
    const navigation = buildProductNavigation({ workspaceId: "workspace-1", brandId: "brand-1" });
    expect(navigation.desktop.map(item => item.displayLabel)).toEqual(APPROVED_DESTINATIONS);
    expect(navigation.mobile.map(item => item.displayLabel)).toEqual(APPROVED_DESTINATIONS);
    expect(navigation.desktop.map(item => item.label)).not.toContain("More");
    expect(navigation.mobile.map(item => item.label)).not.toContain("More");
    expect(displayDestination("Results")).toBe("Results");
  });

  it("keeps only the approved persistent account utilities in the shared shell", () => {
    const shell = source("../app/kairo-product-shell.tsx");
    expect(shell).toContain("<NotificationCentre notifications={notifications} />");
    expect(shell).toContain("<ThemeToggle />");
    expect(shell).toContain("<ProfileMenu addBrandHref={addBrandHref} />");
    expect(shell).not.toContain("<ProductGuide />");
    expect(shell).not.toContain('from "./product-guide"');
  });

  it("keeps the mobile shell free of breadcrumbs and preserves five-column navigation", () => {
    const css = source("../app/shell-baseline.css");
    expect(css).toContain("grid-template-columns: repeat(5, minmax(0, 1fr));");
    expect(css).toContain(".k-shell-breadcrumbs {\n    display: none;");
  });
});
