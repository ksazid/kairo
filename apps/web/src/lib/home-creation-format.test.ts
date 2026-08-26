import { describe, expect, it } from "vitest";
import { homeFormatLabel, inferHomeCreationFormat, recommendHomeFormat } from "./home-creation-format";

describe("Home creation format", () => {
  it("defaults concise ideas to a Post without a recommendation click", () => {
    const result = recommendHomeFormat({ text: "Announce our new summer menu" });
    expect(result.format).toBe("image");
    expect(result.choices).toEqual(["image", "carousel", "reel", "video"]);
  });

  it("selects Carousel for naturally sequential ideas", () => {
    expect(recommendHomeFormat({ text: "Five mistakes to avoid before choosing a CRM" }).format).toBe("carousel");
  });

  it("uses attached video as an Auto format signal", () => {
    expect(recommendHomeFormat({ text: "Show customers how it works", mediaKinds: ["video"] }).format).toBe("reel");
  });

  it("distinguishes long-form Video from Reel", () => {
    expect(recommendHomeFormat({ text: "Create a YouTube deep dive tutorial about our workflow" }).format).toBe("video");
    expect(inferHomeCreationFormat("short-form vertical Reel with voiceover")).toBe("reel");
  });

  it("uses the approved user-facing labels", () => {
    expect(homeFormatLabel("image")).toBe("Post");
    expect(homeFormatLabel("carousel")).toBe("Carousel");
    expect(homeFormatLabel("reel")).toBe("Reel");
    expect(homeFormatLabel("video")).toBe("Video");
  });
});
