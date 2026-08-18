import Link from "next/link";
import type { ReactNode } from "react";
import {
  buildProductNavigation,
  type DesktopProductDestination,
  type MobileProductDestination,
} from "../src/lib/product-navigation";

type ProductShellProps = {
  brandId?: string | null;
  workspaceId?: string | null;
  active?: DesktopProductDestination | null;
  mobileActive?: MobileProductDestination;
  children: ReactNode;
};

export function KairoProductShell({
  brandId,
  workspaceId,
  active,
  mobileActive,
  children,
}: ProductShellProps) {
  const navigation = buildProductNavigation({ brandId, workspaceId });
  const resolvedMobileActive = mobileActive ?? (active ? mobileDestinationFor(active) : "More");

  return (
    <div className="app-shell">
      <a className="skip-link" href="#kairo-main-content">Skip to content</a>
      <aside className="sidebar" aria-label="Primary navigation">
        <div>
          <div className="wordmark"><span className="brandmark" aria-hidden="true" />Kairo</div>
          <p className="sidebar-caption">Content Intelligence</p>
        </div>
        <nav className="nav-list">
          {navigation.desktop.map((item) => item.href ? (
            <Link
              key={item.label}
              className={`nav-item ${item.label === active ? "active" : ""}`}
              href={item.href}
              aria-current={item.label === active ? "page" : undefined}
            >
              {item.label}
            </Link>
          ) : (
            <span key={item.label} className="nav-item disabled" aria-disabled="true">
              {item.label}<small>Select Brand</small>
            </span>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="nav-item disabled" aria-disabled="true">Settings<small>Later</small></span>
          <a className="nav-item" href="/auth/logout">Sign out</a>
        </div>
      </aside>

      {children}

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navigation.mobile.map((item) => item.href ? (
          <Link
            key={item.label}
            href={item.href}
            className={`mobile-nav-item ${item.label === resolvedMobileActive ? "active" : ""}`}
            aria-current={item.label === resolvedMobileActive ? "page" : undefined}
          >
            {item.label}
          </Link>
        ) : (
          <span key={item.label} className="mobile-nav-item disabled" aria-disabled="true">{item.label}</span>
        ))}
      </nav>
    </div>
  );
}

export function KairoScopePicker({
  brandName,
  workspaceName,
  meta,
}: {
  brandName: string;
  workspaceName?: string | null;
  meta?: string;
}) {
  return (
    <div className="scope-picker" aria-label="Current Brand scope">
      <span className="scope-label">Brand</span>
      <strong>{brandName}</strong>
      <span className="scope-meta">{workspaceName ?? meta ?? "Private Brand context"}</span>
    </div>
  );
}

function mobileDestinationFor(active: DesktopProductDestination): MobileProductDestination {
  if (active === "Today" || active === "Discover" || active === "Ideas" || active === "Calendar") return active;
  return "More";
}
