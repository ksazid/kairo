import { normalizeCreationFormat, type CreationFormat } from "./home";
import type { HomeOpportunity } from "./api";

export type DiscoverFilter = "all" | "trending" | "great-fit" | "saved";

export type DiscoverCard = HomeOpportunity & {
  image: "/malta-car.webp" | "/malta-drive.webp" | "/car-keys.webp";
  format: CreationFormat;
  formatLabel: string;
  channel: string;
  trend: "Trending" | "Rising";
  fit: "Great fit" | "Good fit";
  opportunity: "High opportunity" | "Medium opportunity";
};

const media = ["/malta-car.webp", "/malta-drive.webp", "/car-keys.webp"] as const;

export const discoverFallback: HomeOpportunity[] = [
  { id: "one", title: "3 mistakes customers make when renting a car in Malta", rationale: "Practical local advice positions your Brand as the helpful expert.", whyNow: "Rental car searches are rising as travel season approaches.", developmentDirection: "Build a mistake-led guide with clear local advice.", status: "new", scores: { relevance: .94, audienceFit: .91, overall: .93 }, details: { recommendedFormat: "reel", recommendedChannel: "instagram", targetAudience: "Malta travellers", objective: "Educate" } },
  { id: "two", title: "Best hidden beaches to visit in Malta", rationale: "A local-first guide gives travellers something useful to save and share.", whyNow: "Hidden-gem travel content is accelerating before the summer peak.", status: "new", scores: { relevance: .9, audienceFit: .88, overall: .89 }, details: { recommendedFormat: "reel", recommendedChannel: "instagram", targetAudience: "Experience-led travellers", objective: "Inspire" } },
  { id: "three", title: "How to get the best car rental deals", rationale: "Clear buying advice builds trust before customers compare providers.", whyNow: "Price-sensitive searches are increasing across Malta travel planning.", status: "saved", scores: { relevance: .87, audienceFit: .86, overall: .86 }, details: { recommendedFormat: "image", recommendedChannel: "linkedin", targetAudience: "Value-conscious travellers", objective: "Educate" } },
  { id: "four", title: "24 hours in Valletta: the perfect itinerary", rationale: "An itinerary connects your service to a complete and memorable day.", whyNow: "Short itinerary formats are gaining saves across destination content.", status: "new", scores: { relevance: .84, audienceFit: .82, overall: .83 }, details: { recommendedFormat: "carousel", recommendedChannel: "instagram", targetAudience: "First-time visitors", objective: "Inspire" } },
  { id: "five", title: "The Malta road-trip checklist nobody gives you", rationale: "A practical checklist turns local experience into strong Brand authority.", whyNow: "Planning-led carousels are outperforming generic destination lists.", status: "new", scores: { relevance: .82, audienceFit: .8, overall: .81 }, details: { recommendedFormat: "carousel", recommendedChannel: "facebook", targetAudience: "Independent travellers", objective: "Educate" } },
  { id: "six", title: "Airport pickup in Malta: what to know before landing", rationale: "Answering arrival questions removes uncertainty at a high-intent moment.", whyNow: "Airport-transfer questions are rising alongside seasonal arrivals.", status: "new", scores: { relevance: .78, audienceFit: .79, overall: .79 }, details: { recommendedFormat: "image", recommendedChannel: "linkedin", targetAudience: "Business and leisure arrivals", objective: "Convert" } },
];

export function toDiscoverCards(opportunities: HomeOpportunity[]): DiscoverCard[] {
  return opportunities.filter((item) => item.status !== "ignored").map((item, index) => {
    const score = item.scores?.overall ?? item.scores?.audienceFit ?? item.scores?.relevance ?? .75;
    const format = normalizeCreationFormat(item.details?.recommendedFormat);
    return {
      ...item,
      image: media[index % media.length]!,
      format,
      formatLabel: format === "image" ? "Post" : format === "carousel" ? "Carousel" : format === "campaign" ? "Campaign" : "Reel",
      channel: channelLabel(item.details?.recommendedChannel),
      trend: index % 4 === 3 ? "Rising" : "Trending",
      fit: score >= .8 ? "Great fit" : "Good fit",
      opportunity: score >= .8 ? "High opportunity" : "Medium opportunity",
    };
  });
}

export function filterDiscoverCards(cards: DiscoverCard[], input: { query: string; filter: DiscoverFilter; format: string; channel: string }): DiscoverCard[] {
  const query = input.query.trim().toLowerCase();
  return cards.filter((card) => {
    if (query && ![card.title, card.rationale, card.whyNow, card.channel, card.formatLabel].filter(Boolean).some((value) => value!.toLowerCase().includes(query))) return false;
    if (input.filter === "trending" && card.trend !== "Trending") return false;
    if (input.filter === "great-fit" && card.fit !== "Great fit") return false;
    if (input.filter === "saved" && card.status !== "saved") return false;
    if (input.format !== "all" && card.format !== input.format) return false;
    if (input.channel !== "all" && card.channel.toLowerCase() !== input.channel) return false;
    return true;
  });
}

export function discoverPreviewHref(id: string, brandId?: string) {
  return `/discover/${encodeURIComponent(id)}${brandId ? `?brand=${encodeURIComponent(brandId)}` : ""}`;
}

function channelLabel(value?: string) {
  const channel = value?.trim().toLowerCase();
  if (channel === "linkedin") return "LinkedIn";
  if (channel === "facebook") return "Facebook";
  if (channel === "youtube") return "YouTube";
  return "Instagram";
}
