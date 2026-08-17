export const DESKTOP_PRODUCT_DESTINATIONS = [
  "Today",
  "Discover",
  "Ideas",
  "Campaigns",
  "Content Studio",
  "Calendar",
  "Performance",
  "Brand Brain",
] as const;

export const MOBILE_PRODUCT_DESTINATIONS = ["Today", "Discover", "Ideas", "Calendar", "More"] as const;

export type DesktopProductDestination = (typeof DESKTOP_PRODUCT_DESTINATIONS)[number];
export type MobileProductDestination = (typeof MOBILE_PRODUCT_DESTINATIONS)[number];

export type ProductNavigationItem<TLabel extends string> = {
  label: TLabel;
  href: string | null;
};

export function buildProductNavigation({
  brandId,
  workspaceId,
}: {
  brandId?: string | null;
  workspaceId?: string | null;
}): {
  desktop: ProductNavigationItem<DesktopProductDestination>[];
  mobile: ProductNavigationItem<MobileProductDestination>[];
} {
  const brand = brandId ? encodeURIComponent(brandId) : null;
  const base = brand ? `/brands/${brand}` : null;
  const todayHref = buildTodayHref(workspaceId, brandId);

  const desktop: ProductNavigationItem<DesktopProductDestination>[] = [
    { label: "Today", href: todayHref },
    { label: "Discover", href: base ? `${base}/discover` : null },
    { label: "Ideas", href: base ? `${base}/ideas` : null },
    { label: "Campaigns", href: base ? `${base}/campaigns` : null },
    // Content Studio is currently entered from Campaigns. VS-50 centralizes the
    // existing route contract but does not invent a new product route.
    { label: "Content Studio", href: base ? `${base}/campaigns` : null },
    { label: "Calendar", href: base ? `${base}/calendar` : null },
    { label: "Performance", href: base ? `${base}/performance` : null },
    { label: "Brand Brain", href: base ? `${base}/brain` : null },
  ];

  const mobile: ProductNavigationItem<MobileProductDestination>[] = [
    { label: "Today", href: todayHref },
    { label: "Discover", href: base ? `${base}/discover` : null },
    { label: "Ideas", href: base ? `${base}/ideas` : null },
    { label: "Calendar", href: base ? `${base}/calendar` : null },
    { label: "More", href: base ? `${base}/more` : null },
  ];

  return { desktop, mobile };
}

function buildTodayHref(workspaceId?: string | null, brandId?: string | null): string {
  const params = new URLSearchParams();
  if (workspaceId) params.set("workspace", workspaceId);
  if (brandId) params.set("brand", brandId);
  const query = params.toString();
  return query ? `/?${query}` : "/";
}
