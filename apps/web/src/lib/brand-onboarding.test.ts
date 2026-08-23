import { describe, expect, it } from "vitest";
import { brandNameFromReference, normalizeBrandReferenceUrl } from "./brand-onboarding";

describe("Brand onboarding URL helpers", () => {
  it("normalizes a URL without requiring the user to type a scheme", () => {
    expect(normalizeBrandReferenceUrl("instagram.com/thedukeman")).toBe("https://instagram.com/thedukeman");
  });

  it("infers a social Brand name from the public profile path", () => {
    expect(brandNameFromReference("https://www.instagram.com/the_duke_man/")).toBe("The Duke Man");
    expect(brandNameFromReference("https://www.linkedin.com/company/kairo-ai/")).toBe("Kairo Ai");
    expect(brandNameFromReference("https://www.youtube.com/@thedukeman")).toBe("Thedukeman");
  });

  it("falls back to the public website host for ordinary Brand sites", () => {
    expect(brandNameFromReference("https://kairo.ai/about")).toBe("Kairo");
  });

  it("rejects non-http URLs and embedded credentials", () => {
    expect(() => normalizeBrandReferenceUrl("ftp://example.com")).toThrow(/HTTP\(S\)/i);
    expect(() => normalizeBrandReferenceUrl("https://user:pass@example.com")).toThrow(/credentials/i);
  });
});
