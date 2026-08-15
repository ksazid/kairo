import Link from "next/link";

export function PilotMobileNav({ brandId, active }: { brandId: string; active: "Today" | "Discover" | "Ideas" | "Calendar" | "More" }) {
  const brand = encodeURIComponent(brandId);
  const items = [
    { label: "Today", href: `/?brand=${brand}` },
    { label: "Discover", href: `/brands/${brand}/discover` },
    { label: "Ideas", href: `/brands/${brand}/ideas` },
    { label: "Calendar", href: `/brands/${brand}/calendar` },
    { label: "More", href: `/brands/${brand}/more` },
  ] as const;
  return <nav className="mobile-nav" aria-label="Mobile navigation">{items.map((item) => <Link key={item.label} href={item.href} className={`mobile-nav-item ${item.label === active ? "active" : ""}`} aria-current={item.label === active ? "page" : undefined}>{item.label}</Link>)}</nav>;
}
