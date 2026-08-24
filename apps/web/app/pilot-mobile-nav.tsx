import Link from "next/link";

export function PilotMobileNav({ brandId, active }: { brandId: string; active: string }) {
  const brand = encodeURIComponent(brandId);
  const items = [
    { label: "Home", href: `/?brand=${brand}` },
    { label: "Content", href: `/brands/${brand}/campaigns` },
    { label: "Calendar", href: `/brands/${brand}/calendar` },
    { label: "Insights", href: `/brands/${brand}/performance` },
    { label: "Brand", href: `/brands/${brand}/brain` },
  ] as const;
  const resolvedActive = legacyPrimaryDestination(active);
  return <nav className="mobile-nav" aria-label="Mobile navigation">{items.map((item) => <Link key={item.label} href={item.href} className={`mobile-nav-item ${item.label === resolvedActive ? "active" : ""}`} aria-current={item.label === resolvedActive ? "page" : undefined}>{item.label}</Link>)}</nav>;
}

function legacyPrimaryDestination(active: string) {
  if (["Today", "Discover", "Ideas", "Home"].includes(active)) return "Home";
  if (["Campaigns", "Content Studio", "Formats", "Content"].includes(active)) return "Content";
  if (["Performance", "Results", "Insights"].includes(active)) return "Insights";
  if (["Brand Brain", "More", "Operations", "Brand"].includes(active)) return "Brand";
  return active;
}
