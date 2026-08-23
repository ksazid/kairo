const SOCIAL_HOSTS = new Set([
  "instagram.com",
  "www.instagram.com",
  "linkedin.com",
  "www.linkedin.com",
  "youtube.com",
  "www.youtube.com",
  "facebook.com",
  "www.facebook.com",
  "tiktok.com",
  "www.tiktok.com",
]);

const RESERVED_SEGMENTS = new Set([
  "company",
  "companies",
  "channel",
  "c",
  "user",
  "users",
  "p",
  "reel",
  "reels",
  "posts",
  "watch",
  "shorts",
]);

export function normalizeBrandReferenceUrl(raw: string): string {
  const value = raw.trim();
  if (!value) throw new Error("Paste a public Brand URL");
  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error("Enter a valid public URL");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Enter an HTTP(S) URL");
  if (url.username || url.password) throw new Error("URL credentials are not supported");
  return url.toString();
}

export function brandNameFromReference(referenceUrl: string): string {
  const url = new URL(referenceUrl);
  const host = url.hostname.toLowerCase();
  const segments = url.pathname.split("/").map((part) => decodeURIComponent(part).trim()).filter(Boolean);

  if (SOCIAL_HOSTS.has(host)) {
    const candidate = [...segments].reverse().find((segment) => !RESERVED_SEGMENTS.has(segment.toLowerCase()));
    if (candidate) return humanize(candidate.replace(/^@/, ""));
  }

  const hostname = host.replace(/^www\./, "");
  const stem = hostname.split(".")[0] ?? hostname;
  return humanize(stem) || hostname;
}

function humanize(value: string): string {
  const cleaned = value.replace(/[._-]+/g, " ").replace(/\s+/g, " ").trim();
  if (!cleaned) return "Brand";
  return cleaned
    .split(" ")
    .map((word) => word.length <= 3 && word === word.toUpperCase() ? word : `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ")
    .slice(0, 120);
}
