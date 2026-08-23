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
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const segments = url.pathname.split("/").map((part) => decodeURIComponent(part).trim()).filter(Boolean);
  const socialName = socialProfileName(host, segments);
  if (socialName) return humanize(socialName.replace(/^@/, ""));

  const stem = host.split(".")[0] ?? host;
  return humanize(stem) || host;
}

function socialProfileName(host: string, segments: string[]): string | undefined {
  const [first, second] = segments;
  if (!first) return undefined;

  if (host === "instagram.com" || host === "facebook.com") {
    return new Set(["p", "reel", "reels", "stories", "watch", "share"]).has(first.toLowerCase()) ? undefined : first;
  }
  if (host === "linkedin.com") {
    if (["company", "in", "school"].includes(first.toLowerCase())) return second;
    return ["posts", "feed", "pulse"].includes(first.toLowerCase()) ? undefined : first;
  }
  if (host === "youtube.com") {
    if (first.startsWith("@")) return first;
    if (["channel", "c", "user"].includes(first.toLowerCase())) return second;
    return undefined;
  }
  if (host === "tiktok.com") return first.startsWith("@") ? first : undefined;
  return undefined;
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
