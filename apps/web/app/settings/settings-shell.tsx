import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getBrands, getSession } from "../../src/lib/kairo-api";
import { KairoProductShell } from "../kairo-product-shell";
import "./settings-shell.css";

export type SettingsSection =
  | "general"
  | "team"
  | "billing"
  | "notifications"
  | "security"
  | "ai-providers"
  | "media-providers"
  | "audit-log";

const NAV: Array<{ id: SettingsSection; label: string; href: string }> = [
  { id: "general", label: "General", href: "/settings" },
  { id: "team", label: "Team", href: "/settings/team" },
  { id: "billing", label: "Billing", href: "/settings/billing" },
  { id: "notifications", label: "Notifications", href: "/settings/notifications" },
  { id: "security", label: "Security", href: "/settings/security" },
  { id: "ai-providers", label: "AI Providers", href: "/settings/ai-providers" },
  { id: "media-providers", label: "Media Providers", href: "/settings/media-providers" },
  { id: "audit-log", label: "Audit Log", href: "/settings/audit-log" },
];

export async function SettingsShell({
  active,
  title,
  description,
  breadcrumb,
  children,
}: {
  active: SettingsSection;
  title: string;
  description: string;
  breadcrumb?: string[];
  children: ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect(`/auth/login?returnTo=${encodeURIComponent(pathFor(active))}`);
  const workspace = session.workspaces[0];
  if (!workspace) redirect("/onboarding");
  const brands = await getBrands(workspace.id).catch(() => []);
  const brand = brands[0] ?? null;
  const trail = breadcrumb ?? [title];

  return (
    <KairoProductShell brandId={brand?.id} workspaceId={workspace.id} pageLabel="Settings">
      <main id="kairo-main-content" tabIndex={-1} className="workspace-main settings-shell-main">
        <div className="settings-shell-layout">
          <aside className="settings-shell-nav" aria-label="Settings navigation">
            <div className="settings-shell-nav-heading">Settings</div>
            <nav>
              {NAV.map((item) => (
                <Link key={item.id} href={item.href} aria-current={item.id === active ? "page" : undefined}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          <div className="settings-shell-content">
            <nav className="settings-breadcrumb" aria-label="Breadcrumb">
              <Link href="/settings">Settings</Link>
              {trail.map((item, index) => (
                <span key={`${item}-${index}`}><span aria-hidden="true">/</span><span>{item}</span></span>
              ))}
            </nav>
            <header className="settings-page-header">
              <h1>{title}</h1>
              <p>{description}</p>
            </header>
            {children}
          </div>
        </div>
      </main>
    </KairoProductShell>
  );
}

function pathFor(active: SettingsSection) {
  return NAV.find((item) => item.id === active)?.href ?? "/settings";
}
