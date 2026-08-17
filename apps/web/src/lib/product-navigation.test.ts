import { describe, expect, it } from "vitest";
import {
  buildProductNavigation,
  DESKTOP_PRODUCT_DESTINATIONS,
  MOBILE_PRODUCT_DESTINATIONS,
} from "./product-navigation";

describe("VS-50 product navigation", () => {
  it("keeps the approved desktop and five-item mobile information architecture", () => {
    expect(DESKTOP_PRODUCT_DESTINATIONS).toEqual([
      "Today",
      "Discover",
      "Ideas",
      "Campaigns",
      "Content Studio",
      "Calendar",
      "Performance",
      "Brand Brain",
    ]);
    expect(MOBILE_PRODUCT_DESTINATIONS).toEqual(["Today", "Discover", "Ideas", "Calendar", "More"]);
  });

  it("preserves Workspace and Brand scope in the Today link", () => {
    const navigation = buildProductNavigation({ workspaceId: "workspace one", brandId: "brand/two" });
    expect(navigation.desktop[0]).toEqual({
      label: "Today",
      href: "/?workspace=workspace+one&brand=brand%2Ftwo",
    });
  });

  it("builds Brand-scoped destinations without expanding product routes", () => {
    const navigation = buildProductNavigation({ brandId: "brand-a" });
    expect(navigation.desktop.find((item) => item.label === "Discover")?.href).toBe("/brands/brand-a/discover");
    expect(navigation.desktop.find((item) => item.label === "Campaigns")?.href).toBe("/brands/brand-a/campaigns");
    expect(navigation.desktop.find((item) => item.label === "Content Studio")?.href).toBe("/brands/brand-a/campaigns");
    expect(navigation.mobile).toHaveLength(5);
  });

  it("fails closed for Brand-specific destinations when no Brand is selected", () => {
    const navigation = buildProductNavigation({ workspaceId: "workspace-a" });
    expect(navigation.desktop[0]?.href).toBe("/?workspace=workspace-a");
    expect(navigation.desktop.slice(1).every((item) => item.href === null)).toBe(true);
    expect(navigation.mobile.slice(1).every((item) => item.href === null)).toBe(true);
  });
});
