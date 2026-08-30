import { describe, expect, it } from "vitest";
import { discoverFallback, discoverPreviewHref, filterDiscoverCards, toDiscoverCards } from "./discover";
import { DEFAULT_LISTING_VIEW, normalizeListingView } from "./listing-view";

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
    expect(filterDiscoverCards(cards, { query: "", filter: "developing", format: "all", channel: "all" }).map((card) => card.id)).toEqual(["five"]);
    expect(filterDiscoverCards(cards, { query: "", filter: "all", format: "all", channel: "all", source: "buzzsumo" }).map((card) => card.id)).toEqual(["five", "six"]);
  });

  it("excludes dismissed opportunities", () => {
    expect(toDiscoverCards([{ ...discoverFallback[0]!, status: "ignored" }])).toEqual([]);
  });

  it("creates Brand-scoped preview links safely", () => {
    expect(discoverPreviewHref("idea/1", "brand one")).toBe("/discover/idea%2F1?brand=brand%20one");
    expect(discoverPreviewHref("idea")).toBe("/discover/idea");
  });

  it("defaults unknown listing preferences to the approved table view", () => {
    expect(DEFAULT_LISTING_VIEW).toBe("table");
    expect(normalizeListingView("grid")).toBe("grid");
    expect(normalizeListingView("list")).toBe("table");
    expect(normalizeListingView(null)).toBe("table");
  });
});
