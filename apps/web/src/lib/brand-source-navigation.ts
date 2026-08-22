const OAUTH_RETURN_COOKIE = "kairo_instagram_return_to";
const META_RETURN_COOKIE = "kairo_meta_return_to";

export { META_RETURN_COOKIE, OAUTH_RETURN_COOKIE };

export function safeBrandReturnTo(value: string | null | undefined, brandId: string): string {
  const fallback = `/brands/${encodeURIComponent(brandId)}/brain`;
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  try {
    const parsed = new URL(value, "https://kairo.local");
    if (parsed.origin !== "https://kairo.local") return fallback;
    const prefix = `/brands/${encodeURIComponent(brandId)}/`;
    return parsed.pathname.startsWith(prefix) ? `${parsed.pathname}${parsed.search}${parsed.hash}` : fallback;
  } catch {
    return fallback;
  }
}

export function safeStoredBrandReturn(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/brands/") || value.startsWith("//")) return null;
  const match = /^\/brands\/([^/]+)\//.exec(value);
  if (!match?.[1]) return null;
  try {
    const brandId = decodeURIComponent(match[1]);
    return safeBrandReturnTo(value, brandId);
  } catch {
    return null;
  }
}
