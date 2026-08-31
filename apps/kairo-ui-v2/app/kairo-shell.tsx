import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  BarChart3,
  Bell,
  CalendarDays,
  ChevronDown,
  Compass,
  ExternalLink,
  FileText,
  Home as HomeIcon,
  Megaphone,
  Settings2,
  Sparkles,
} from "lucide-react";

type ActiveDestination = "Home" | "Discover" | "Content" | "Campaigns" | "Calendar" | "Insights" | "Brand";

export function KairoShell({
  active,
  authenticated,
  brandId,
  brandName,
  children,
  workspaceClassName = "",
  proTip = "Connect more channels to get smarter recommendations.",
  proTipAction = "Connect channels",
  proTipHref,
}: {
  active: ActiveDestination;
  authenticated: boolean;
  brandId?: string;
  brandName: string;
  children: ReactNode;
  workspaceClassName?: string;
  proTip?: string;
  proTipAction?: string;
  proTipHref?: string;
}) {
  const webUrl = (process.env.NEXT_PUBLIC_KAIRO_WEB_URL ?? "https://kairo-two-plum.vercel.app").replace(/\/$/, "");
  const brandBase = brandId ? `${webUrl}/brands/${encodeURIComponent(brandId)}` : webUrl;
  const discoverQuery = brandId ? `?brand=${encodeURIComponent(brandId)}` : "";
  const nav = [
    { label: "Home" as const, Icon: HomeIcon, href: brandId ? `/?brand=${encodeURIComponent(brandId)}` : "/" },
    { label: "Discover" as const, Icon: Compass, href: `/discover${discoverQuery}` },
    { label: "Content" as const, Icon: FileText, href: brandId ? `/content?brand=${encodeURIComponent(brandId)}` : "/content" },
    { label: "Campaigns" as const, Icon: Megaphone, href: brandId ? `/campaigns?brand=${encodeURIComponent(brandId)}` : "/campaigns" },
    { label: "Calendar" as const, Icon: CalendarDays, href: brandId ? `${brandBase}/calendar` : webUrl },
    { label: "Insights" as const, Icon: BarChart3, href: brandId ? `${brandBase}/performance` : webUrl },
    { label: "Brand" as const, Icon: Settings2, href: brandId ? `${brandBase}/brain` : webUrl },
  ];

  return <div className="app-shell">
    <aside className="sidebar">
      <Link className="brand-logo" href={brandId ? `/?brand=${encodeURIComponent(brandId)}` : "/"}><Image src="/kairo-logo.svg" alt="" width="48" height="48" priority/><span>Kairo</span></Link>
      <nav aria-label="Primary navigation">{nav.map(({ label, Icon, href }) => href.startsWith("/") ? <Link key={label} className={active === label ? "active" : ""} href={href}><Icon aria-hidden="true"/>{label}</Link> : <a key={label} className={active === label ? "active" : ""} href={href}><Icon aria-hidden="true"/>{label}</a>)}</nav>
      <a className="classic-link" href={webUrl}><ExternalLink aria-hidden="true"/>Back to Classic Kairo</a>
      <div className="pro-tip"><span><Sparkles aria-hidden="true"/>Pro tip</span><p>{proTip}</p><a href={proTipHref ?? (brandId ? `${brandBase}/channels` : webUrl)}>{proTipAction} <span>›</span></a></div>
    </aside>
    <main>
      <header className="topbar">
        <button className="brand-select" type="button"><span className="brand-avatar">{brandName.slice(0, 1).toUpperCase()}</span><strong>{brandName}</strong><ChevronDown aria-hidden="true"/></button>
        <span className="ready-dot"><i/>{authenticated ? "Brand ready" : "Preview mode"}</span>
        <div className="top-spacer"/>
        <a className="mobile-classic" href={webUrl} aria-label="Back to Classic Kairo"><ExternalLink aria-hidden="true"/></a>
        <button className="bell" type="button" aria-label="Notifications"><Bell aria-hidden="true"/><b>3</b></button>
        {authenticated ? <a className="profile" href="/auth/logout"><span>SK</span><strong>Sazzad</strong><ChevronDown aria-hidden="true"/></a> : <a className="profile auth-profile" href="/auth/login"><span>SK</span><strong>Sign in</strong></a>}
      </header>
      <div className={`workspace ${workspaceClassName}`.trim()}>{children}</div>
    </main>
  </div>;
}
