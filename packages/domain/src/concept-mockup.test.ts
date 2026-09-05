import { describe, expect, it } from "vitest";
import { isConceptMockup, type ConceptMockup } from "./concept-mockup";

const base = { version: 1 as const, hook: "A useful idea" };

describe("ConceptMockup", () => {
  it("accepts text concepts", () => {
    const value: ConceptMockup = {
      ...base,
      format: "text",
      text: { hook: "A useful idea", keyPoints: ["Point one"] },
    };
    expect(isConceptMockup(value)).toBe(true);
  });

  it("accepts image concepts", () => {
    const value: ConceptMockup = {
      ...base,
      format: "image",
      image: { headline: "A useful idea", visualSubject: "A clear product scene" },
    };
    expect(isConceptMockup(value)).toBe(true);
  });

  it("accepts carousel concepts", () => {
    const value: ConceptMockup = {
      ...base,
      format: "carousel",
      carousel: {
        cover: { headline: "A useful idea" },
        slides: [{ headline: "Supporting point" }],
        cardCount: 4,
      },
    };
    expect(isConceptMockup(value)).toBe(true);
  });

  it("accepts reel concepts", () => {
    const value: ConceptMockup = {
      ...base,
      format: "reel",
      reel: {
        hook: "A useful idea",
        durationSeconds: 20,
        openingFrame: "Opening frame",
        scenes: [{ startSeconds: 0, endSeconds: 3, beat: "Hook" }],
      },
    };
    expect(isConceptMockup(value)).toBe(true);
  });

  it("rejects a malformed format-specific payload", () => {
    expect(isConceptMockup({ ...base, format: "reel", reel: { hook: "x" } })).toBe(false);
  });
});
