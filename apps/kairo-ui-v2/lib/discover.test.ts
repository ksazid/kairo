import { describe, expect, it } from "vitest";
import { discoverFallback, discoverPreviewHref, filterDiscoverCards, toDiscoverCards } from "./discover";

describe("Discover presentation", () => {
  it("projects opportunities into complete visual cards", () => {
    const cards = toDiscoverCards(discoverFallback);
    expect(cards).toHaveLength(6);
    expect(cards[0]).toMatchObject({ format: "reel", formatLabel: "Reel", channel: "Instagram", fit: "Great fit" });
    expect(cards.every((card) => Boolean(card.image) && Boolean(card.opportunity))).toBe(true);
  });

  it("filters by search, state, format and channel", () => {
    const cards = toDiscoverCards(discoverFallback);
    expect(filterDiscoverCards(cards, { query: "airport", filter: "all", format: "all", channel: "all" }).map((card) => card.id)).toEqual(["six"]);
    expect(filterDiscoverCards(cards, { query: "", filter: "saved", format: "all", channel: "all" }).map((card) => card.id)).toEqual(["three"]);
    expect(filterDiscoverCards(cards, { query: "", filter: "all", format: "carousel", channel: "instagram" }).map((card) => card.id)).toEqual(["four"]);
  });

  it("excludes dismissed opportunities", () => {
    expect(toDiscoverCards([{ ...discoverFallback[0]!, status: "ignored" }])).toEqual([]);
  });

  it("creates Brand-scoped preview links safely", () => {
    expect(discoverPreviewHref("idea/1", "brand one")).toBe("/discover/idea%2F1?brand=brand%20one");
    expect(discoverPreviewHref("idea")).toBe("/discover/idea");
  });
});
