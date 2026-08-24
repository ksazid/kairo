import Link from "next/link";
import { PilotMobileNav } from "./pilot-mobile-nav";

// Compatibility helpers for the remaining legacy Calendar and Formats layouts.
// New surfaces use KairoProductShell directly. Keep the same five user-facing
// destinations here until those legacy layouts are migrated.
export function KairoSidebar({ brandId, active }: { brandId: string; active: string }) {
  const brand = encodeURIComponent(brandId);
  const items = [
    { label: "Home", href: `/?brand=${brand}` },
    { label: "Content", href: `/brands/${brand}/campaigns` },
    { label: "Calendar", href: `/brands/${brand}/calendar` },
    { label: "Insights", href: `/brands/${brand}/performance` },
    { label: "Brand", href: `/brands/${brand}/brain` },
  ];
  const resolvedActive = legacyPrimaryDestination(active);
  return <aside className="sidebar" aria-label="Primary navigation"><div><div className="wordmark"><span className="brandmark" aria-hidden="true" />Kairo</div><p className="sidebar-caption">Content Intelligence</p></div><nav className="nav-list">{items.map((item) => <Link key={item.label} href={item.href} className={`nav-item ${item.label === resolvedActive ? "active" : ""}`} aria-current={item.label === resolvedActive ? "page" : undefined}>{item.label}</Link>)}</nav><div className="sidebar-footer"><Link className="nav-item" href="/settings">Settings</Link><a className="nav-item" href="/auth/logout">Sign out</a></div></aside>;
}

export function MobileIdeasNav({ brandId }: { brandId: string }) {
  return <PilotMobileNav brandId={brandId} active="Ideas" />;
}

function legacyPrimaryDestination(active: string) {
  if (["Today", "Discover", "Ideas", "Home"].includes(active)) return "Home";
  if (["Campaigns", "Content Studio", "Formats", "Content"].includes(active)) return "Content";
  if (["Performance", "Results", "Insights"].includes(active)) return "Insights";
  if (["Brand Brain", "More", "Operations", "Brand"].includes(active)) return "Brand";
  return active;
}
