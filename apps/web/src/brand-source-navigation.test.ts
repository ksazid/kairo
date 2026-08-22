import { describe, expect, it } from "vitest";
import { safeBrandReturnTo, safeStoredBrandReturn } from "./lib/brand-source-navigation";

describe("Brand source navigation", () => {
  it("keeps OAuth returns inside the Brand that started the connection", () => {
    expect(safeBrandReturnTo("/brands/brand-1/brain?setup=open", "brand-1")).toBe("/brands/brand-1/brain?setup=open");
    expect(safeBrandReturnTo("/brands/brand-2/brain", "brand-1")).toBe("/brands/brand-1/brain");
  });

  it("rejects external, protocol-relative and unrelated OAuth returns", () => {
    expect(safeBrandReturnTo("https://evil.example/brands/brand-1/brain", "brand-1")).toBe("/brands/brand-1/brain");
    expect(safeBrandReturnTo("//evil.example/brands/brand-1/brain", "brand-1")).toBe("/brands/brand-1/brain");
    expect(safeBrandReturnTo("/onboarding", "brand-1")).toBe("/brands/brand-1/brain");
  });

  it("accepts only a bounded Brand route from the short-lived server cookie", () => {
    expect(safeStoredBrandReturn("/brands/brand%201/brain")).toBe("/brands/brand%201/brain");
    expect(safeStoredBrandReturn("/performance")).toBeNull();
    expect(safeStoredBrandReturn("//evil.example/brands/brand-1/brain")).toBeNull();
  });
});
