import Link from "next/link";
import { PilotMobileNav } from "./pilot-mobile-nav";

// Compatibility helpers for the remaining legacy Calendar and Formats layouts.
// New surfaces use KairoProductShell directly.
export function KairoSidebar({ brandId, active }: { brandId: string; active: string }) {
  const items = ["Today", "Discover", "Ideas", "Campaigns", "Content Studio", "Calendar", "Performance", "Brand Brain"];
  return <aside className="sidebar" aria-label="Primary navigation"><div><div className="wordmark"><span className="brandmark" aria-hidden="true" />Kairo</div><p className="sidebar-caption">Content Intelligence</p></div><nav className="nav-list">{items.map((item) => { const href = item === "Today" ? `/?brand=${encodeURIComponent(brandId)}` : item === "Discover" ? `/brands/${encodeURIComponent(brandId)}/discover` : item === "Ideas" ? `/brands/${encodeURIComponent(brandId)}/ideas` : item === "Campaigns" || item === "Content Studio" ? `/brands/${encodeURIComponent(brandId)}/campaigns` : item === "Calendar" ? `/brands/${encodeURIComponent(brandId)}/calendar` : item === "Performance" ? `/brands/${encodeURIComponent(brandId)}/performance` : item === "Brand Brain" ? `/brands/${encodeURIComponent(brandId)}/brain` : null; return href ? <Link key={item} href={href} className={`nav-item ${item === active ? "active" : ""}`} aria-current={item === active ? "page" : undefined}>{item}</Link> : <span key={item} className="nav-item disabled">{item}<small>Later</small></span>; })}</nav><div className="sidebar-footer"><span className="nav-item disabled">Settings<small>Later</small></span><a className="nav-item" href="/auth/logout">Sign out</a></div></aside>;
}

export function MobileIdeasNav({ brandId }: { brandId: string }) {
  return <PilotMobileNav brandId={brandId} active="Ideas" />;
}
