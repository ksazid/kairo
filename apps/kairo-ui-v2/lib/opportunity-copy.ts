export function compactOpportunityText(value: string | undefined, fallback: string, maxWords = 24) {
  const cleaned = (value ?? fallback).replace(/\s+/g, " ").trim();
  const firstSentence = cleaned.split(/(?<=[.!?])\s+/)[0] ?? cleaned;
  const words = firstSentence.split(" ").filter(Boolean);
  if (words.length <= maxWords) return firstSentence;
  return `${words.slice(0, maxWords).join(" ").replace(/[,:;—-]+$/, "")}…`;
}

export function compactOpportunityTitle(value: string, maxWords = 10) {
  return compactOpportunityText(value, "Untitled opportunity", maxWords);
}
