import type { BrandIntelligenceProfile, SectorIntelligencePack } from "./source-policy";

export const SECTOR_INTELLIGENCE_PACKS = {
  "ai-technology": {
    id: "ai-technology",
    version: "1",
    sector: "AI / SaaS / Developer Technology",
    subsectors: ["Artificial Intelligence", "SaaS", "Developer Technology"],
    topics: ["AI agents", "software architecture", "developer tools", "AI product development"],
    sourceWeights: {
      "agent-reach": 0.6,
      rss: 0.95,
      youtube: 0.9,
      "hacker-news": 0.95,
      bluesky: 0.7,
      openalex: 0.5,
      crossref: 0.4,
    },
    queryTemplates: [
      "latest {topic}",
      "{topic} {geography}",
      "{sector} {topic}",
    ],
  },
  "umrah-religious-travel": {
    id: "umrah-religious-travel",
    version: "1",
    sector: "Umrah / Religious Travel",
    subsectors: ["Umrah", "Pilgrimage", "Religious Travel"],
    topics: ["Umrah visa", "pilgrimage guidance", "Makkah travel", "Madinah travel"],
    sourceWeights: {
      "agent-reach": 0.55,
      rss: 1,
      youtube: 0.9,
      "hacker-news": 0,
      bluesky: 0.25,
      openalex: 0.1,
      crossref: 0.1,
    },
    queryTemplates: [
      "official {topic} {geography}",
      "Umrah {topic}",
      "religious travel {topic}",
    ],
  },
  motorcycles: {
    id: "motorcycles",
    version: "1",
    sector: "Motorcycles / Bikes",
    subsectors: ["Motorcycles", "Bikes", "Electric Motorcycles"],
    topics: ["motorcycle launches", "EV motorcycles", "motorcycle safety", "transport regulation"],
    sourceWeights: {
      "agent-reach": 0.6,
      rss: 0.95,
      youtube: 0.95,
      "hacker-news": 0.2,
      bluesky: 0.45,
      openalex: 0.1,
      crossref: 0.1,
    },
    queryTemplates: [
      "motorcycle {topic}",
      "automotive {topic} {geography}",
      "transport regulation {topic}",
    ],
  },
  "ias-upsc-education": {
    id: "ias-upsc-education",
    version: "1",
    sector: "IAS / UPSC Education",
    subsectors: ["UPSC", "IAS", "Civil Services Education"],
    topics: ["UPSC current affairs", "public policy", "Indian government", "civil services preparation"],
    sourceWeights: {
      "agent-reach": 0.55,
      rss: 1,
      youtube: 0.8,
      "hacker-news": 0.05,
      bluesky: 0.2,
      openalex: 0.2,
      crossref: 0.2,
    },
    queryTemplates: [
      "official India {topic}",
      "UPSC IAS {topic}",
      "government {topic} {geography}",
    ],
  },
} as const satisfies Record<string, SectorIntelligencePack>;

export function selectSectorIntelligencePack(
  profile: BrandIntelligenceProfile,
  packs: readonly SectorIntelligencePack[] = Object.values(SECTOR_INTELLIGENCE_PACKS),
): SectorIntelligencePack | undefined {
  const classifications = [profile.sector, profile.subsector]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map(normalize);
  if (!classifications.length) return undefined;

  const ranked = packs
    .map((pack) => ({ pack, score: packMatchScore(classifications, pack) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.pack.id.localeCompare(b.pack.id));
  return ranked[0]?.pack;
}

function packMatchScore(classifications: readonly string[], pack: SectorIntelligencePack): number {
  const labels = [pack.sector, ...pack.subsectors].map(normalize).filter(Boolean);
  let best = 0;
  for (const classification of classifications) {
    for (const label of labels) {
      if (classification === label) best = Math.max(best, 100);
      else if (label.includes(classification) || classification.includes(label)) best = Math.max(best, 70);
      else best = Math.max(best, tokenOverlap(classification, label));
    }
  }
  return best;
}

function tokenOverlap(left: string, right: string): number {
  const leftTokens = tokenSet(left);
  const rightTokens = tokenSet(right);
  if (!leftTokens.size || !rightTokens.size) return 0;
  let common = 0;
  for (const token of leftTokens) if (rightTokens.has(token)) common += 1;
  return Math.round((common / Math.max(leftTokens.size, rightTokens.size)) * 50);
}

function tokenSet(value: string): Set<string> {
  return new Set(value.split(/[^a-z0-9]+/g).filter((token) => token.length > 1));
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}
