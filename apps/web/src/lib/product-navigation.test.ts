import { describe, expect, it } from "vitest";
import {
  buildProductNavigation,
  DESKTOP_PRODUCT_DESTINATIONS,
  displayDestination,
  MOBILE_PRODUCT_DESTINATIONS,
} from "./product-navigation";

describe("approved product navigation", () => {
  it("keeps stable internal destination keys on desktop and mobile", () => {
    expect(DESKTOP_PRODUCT_DESTINATIONS).toEqual(["Home","Content","Calendar","Results","Brand"]);
    expect(MOBILE_PRODUCT_DESTINATIONS).toEqual(DESKTOP_PRODUCT_DESTINATIONS);
  });

  it("renders Results as the approved user-facing Insights label", () => {
    const navigation = buildProductNavigation({ brandId: "brand-a" });
    expect(navigation.desktop.map((item) => item.displayLabel)).toEqual(["Home","Content","Calendar","Insights","Brand"]);
    expect(displayDestination("Results")).toBe("Insights");
  });

  it("preserves Workspace and Brand scope in the Home link", () => {
    const navigation = buildProductNavigation({ workspaceId: "workspace one", brandId: "brand/two" });
    expect(navigation.desktop[0]).toEqual({
      label: "Home",
      displayLabel: "Home",
      href: "/?workspace=workspace+one&brand=brand%2Ftwo",
    });
  });

  it("routes the primary Content destination to the user-facing Content library", () => {
    const navigation = buildProductNavigation({ brandId: "brand-a" });
    expect(navigation.desktop.find((item) => item.label === "Content")?.href).toBe("/brands/brand-a/content");
    expect(navigation.desktop.find((item) => item.label === "Results")?.href).toBe("/brands/brand-a/performance");
    expect(navigation.mobile).toHaveLength(5);
  });

  it("fails closed for Brand-specific destinations when no Brand is selected", () => {
    const navigation = buildProductNavigation({ workspaceId: "workspace-a" });
    expect(navigation.desktop[0]?.href).toBe("/?workspace=workspace-a");
    expect(navigation.desktop.slice(1).every((item) => item.href === null)).toBe(true);
    expect(navigation.mobile.slice(1).every((item) => item.href === null)).toBe(true);
  });
});
