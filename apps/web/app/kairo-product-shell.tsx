import Link from "next/link";
import type { ReactNode } from "react";
import {
  buildProductNavigation,
  type DesktopProductDestination,
  type MobileProductDestination,
  simpleDestinationFor,
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
  const resolvedActive = active ? simpleDestinationFor(active) : null;
  const resolvedMobileActive = simpleDestinationFor(
    mobileActive ?? active ?? "Brand",
  );
  const addBrandHref = workspaceId
    ? `/brands/new?workspace=${encodeURIComponent(workspaceId)}`
    : "/brands/new";

  return (
    <div className="app-shell">
      <a className="skip-link" href="#kairo-main-content">
        Skip to content
      </a>
      <aside className="sidebar" aria-label="Primary navigation">
        <div>
          <div className="wordmark">
            <span className="brandmark" aria-hidden="true" />
            Kairo
          </div>
          <p className="sidebar-caption">Content Intelligence</p>
        </div>
        <nav className="nav-list">
          {navigation.desktop.map((item) =>
            item.href ? (
              <Link
                key={item.label}
                className={`nav-item ${item.label === resolvedActive ? "active" : ""}`}
                href={item.href}
                aria-current={
                  item.label === resolvedActive ? "page" : undefined
                }
              >
                {item.label}
              </Link>
            ) : (
              <span
                key={item.label}
                className="nav-item disabled"
                aria-disabled="true"
              >
                {item.label}
                <small>Select Brand</small>
              </span>
            ),
          )}
        </nav>
        <div className="sidebar-footer">
          <Link className="nav-item" href={addBrandHref}>
            Add Brand
          </Link>
          <span className="nav-item disabled" aria-disabled="true">
            Settings<small>Later</small>
          </span>
          <a className="nav-item" href="/auth/logout">
            Sign out
          </a>
        </div>
      </aside>

      {children}

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navigation.mobile.map((item) =>
          item.href ? (
            <Link
              key={item.label}
              href={item.href}
              className={`mobile-nav-item ${item.label === resolvedMobileActive ? "active" : ""}`}
              aria-current={
                item.label === resolvedMobileActive ? "page" : undefined
              }
            >
              {item.label}
            </Link>
          ) : (
            <span
              key={item.label}
              className="mobile-nav-item disabled"
              aria-disabled="true"
            >
              {item.label}
            </span>
          ),
        )}
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
      <span className="scope-meta">
        {workspaceName ?? meta ?? "Private Brand context"}
      </span>
      <Link className="context-summary-action" href="/brands/new">
        Add Brand
      </Link>
    </div>
  );
}
