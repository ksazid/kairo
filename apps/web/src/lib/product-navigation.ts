export const DESKTOP_PRODUCT_DESTINATIONS = [
  "Home",
  "Content",
  "Calendar",
  "Results",
  "Brand",
] as const;
export const MOBILE_PRODUCT_DESTINATIONS = [
  "Home",
  "Content",
  "Calendar",
  "Results",
  "Brand",
] as const;
export type SimpleProductDestination =
  (typeof DESKTOP_PRODUCT_DESTINATIONS)[number];
export type DesktopProductDestination =
  | SimpleProductDestination
  | "Create"
  | "Library"
  | "Today"
  | "Discover"
  | "Ideas"
  | "Campaigns"
  | "Content Studio"
  | "Performance"
  | "Brand Brain"
  | "Formats"
  | "Operations";
export type MobileProductDestination =
  | (typeof MOBILE_PRODUCT_DESTINATIONS)[number]
  | "Create"
  | "Library"
  | "Today"
  | "Discover"
  | "Ideas"
  | "More";
export type ProductNavigationItem = {
  label: SimpleProductDestination;
  href: string | null;
};
export function buildProductNavigation({
  brandId,
  workspaceId,
}: {
  brandId?: string | null;
  workspaceId?: string | null;
}) {
  const brand = brandId ? encodeURIComponent(brandId) : null,
    base = brand ? `/brands/${brand}` : null,
    today = buildTodayHref(workspaceId, brandId);
  const items: ProductNavigationItem[] = [
    { label: "Home", href: today },
    { label: "Content", href: base ? `${base}/campaigns` : null },
    { label: "Calendar", href: base ? `${base}/calendar` : null },
    { label: "Results", href: base ? `${base}/performance` : null },
    { label: "Brand", href: base ? `${base}/brain` : null },
  ];
  return { desktop: items, mobile: items };
}
export function simpleDestinationFor(
  active: DesktopProductDestination | MobileProductDestination,
): SimpleProductDestination {
  if (active === "Today" || active === "Discover" || active === "Create" || active === "Ideas" || active === "Formats") return "Home";
  if (active === "Library" || active === "Campaigns" || active === "Content Studio") return "Content";
  if (active === "Performance") return "Results";
  if (active === "Brand Brain" || active === "More" || active === "Operations") return "Brand";
  return active as SimpleProductDestination;
}
function buildTodayHref(workspaceId?: string | null, brandId?: string | null) {
  const params = new URLSearchParams();
  if (workspaceId) params.set("workspace", workspaceId);
  if (brandId) params.set("brand", brandId);
  const query = params.toString();
  return query ? `/?${query}` : "/";
}
