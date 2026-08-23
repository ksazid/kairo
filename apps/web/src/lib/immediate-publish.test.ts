import { describe, expect, it } from "vitest";
import { immediatePublishContentType } from "./immediate-publish";

describe("immediatePublishContentType", () => {
  it("keeps the existing LinkedIn text publish-now path", () => {
    expect(immediatePublishContentType("linkedin", ["text"])).toBe("text");
  });

  it("enables publish-now for a connected Instagram carousel capability", () => {
    expect(immediatePublishContentType("instagram", ["carousel"])).toBe("carousel");
  });

  it("fails closed for unsupported immediate publish combinations", () => {
    expect(immediatePublishContentType("instagram", ["video"])).toBeNull();
    expect(immediatePublishContentType("facebook", ["carousel"])).toBeNull();
  });
});
