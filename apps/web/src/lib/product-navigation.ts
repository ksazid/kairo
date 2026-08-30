export const DESKTOP_PRODUCT_DESTINATIONS = [
  "Home",
  "Content",
  "Campaigns",
  "Discover",
  "Calendar",
  "Results",
  "Brand",
] as const;
export const MOBILE_PRODUCT_DESTINATIONS = [
  "Home",
  "Content",
  "Campaigns",
  "Discover",
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
  displayLabel: "Home" | "Content" | "Campaigns" | "Discover" | "Calendar" | "Insights" | "Brand";
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
    { label: "Home", displayLabel: "Home", href: today },
    { label: "Content", displayLabel: "Content", href: base ? `${base}/content` : null },
    { label: "Campaigns", displayLabel: "Campaigns", href: base ? `${base}/campaigns` : null },
    { label: "Discover", displayLabel: "Discover", href: base ? `${base}/discover` : null },
    { label: "Calendar", displayLabel: "Calendar", href: base ? `${base}/calendar` : null },
    { label: "Results", displayLabel: "Insights", href: base ? `${base}/performance` : null },
    { label: "Brand", displayLabel: "Brand", href: base ? `${base}/brain` : null },
  ];
  return { desktop: items, mobile: items };
}
export function simpleDestinationFor(
  active: DesktopProductDestination | MobileProductDestination,
): SimpleProductDestination {
  if (active === "Today" || active === "Create" || active === "Ideas" || active === "Formats") return "Home";
  if (active === "Library" || active === "Campaigns" || active === "Content Studio") return "Content";
  if (active === "Performance") return "Results";
  if (active === "Brand Brain" || active === "More" || active === "Operations") return "Brand";
  return active as SimpleProductDestination;
}
export function displayDestination(destination: SimpleProductDestination) {
  return destination === "Results" ? "Insights" : destination;
}
function buildTodayHref(workspaceId?: string | null, brandId?: string | null) {
  const params = new URLSearchParams();
  if (workspaceId) params.set("workspace", workspaceId);
  if (brandId) params.set("brand", brandId);
  const query = params.toString();
  return query ? `/?${query}` : "/";
}
