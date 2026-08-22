import { describe, expect, it } from "vitest";
import {
  buildProductNavigation,
  DESKTOP_PRODUCT_DESTINATIONS,
  MOBILE_PRODUCT_DESTINATIONS,
} from "./product-navigation";

describe("VS-79 simple product navigation", () => {
  it("uses the same six clear destinations on desktop and mobile", () => {
    expect(DESKTOP_PRODUCT_DESTINATIONS).toEqual(["Home","Create","Library","Calendar","Results","Brand"]);
    expect(MOBILE_PRODUCT_DESTINATIONS).toEqual(DESKTOP_PRODUCT_DESTINATIONS);
  });

  it("preserves Workspace and Brand scope in the Today link", () => {
    const navigation = buildProductNavigation({ workspaceId: "workspace one", brandId: "brand/two" });
    expect(navigation.desktop[0]).toEqual({
      label: "Home",
      href: "/?workspace=workspace+one&brand=brand%2Ftwo",
    });
  });

  it("builds Brand-scoped destinations without expanding product routes", () => {
    const navigation = buildProductNavigation({ brandId: "brand-a" });
    expect(navigation.desktop.find((item) => item.label === "Create")?.href).toBe("/brands/brand-a/create");
    expect(navigation.desktop.find((item) => item.label === "Library")?.href).toBe("/brands/brand-a/campaigns");
    expect(navigation.desktop.find((item) => item.label === "Results")?.href).toBe("/brands/brand-a/performance");
    expect(navigation.mobile).toHaveLength(6);
  });

  it("fails closed for Brand-specific destinations when no Brand is selected", () => {
    const navigation = buildProductNavigation({ workspaceId: "workspace-a" });
    expect(navigation.desktop[0]?.href).toBe("/?workspace=workspace-a");
    expect(navigation.desktop.slice(1).every((item) => item.href === null)).toBe(true);
    expect(navigation.mobile.slice(1).every((item) => item.href === null)).toBe(true);
  });
});
