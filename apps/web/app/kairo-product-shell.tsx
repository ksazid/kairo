import Link from "next/link";
import type { ReactNode } from "react";
import { getBrandNotifications, getBrands, getSession } from "../src/lib/kairo-api";
import { productNotificationView } from "../src/lib/product-notification-view";
import { KairoIcon, KairoLogo, type KairoIconName } from "./kairo-icons";
import { BrandSwitcher } from "./brand-switcher";
import { ProfileMenu } from "./profile-menu";
import { ThemeToggle } from "./theme-toggle";
import { NotificationCentre, type ProductNotification } from "./ui-states";
import {
  buildProductNavigation,
  displayDestination,
  type DesktopProductDestination,
  type MobileProductDestination,
  simpleDestinationFor,
} from "../src/lib/product-navigation";

type ProductShellProps = {
  brandId?: string | null;
  workspaceId?: string | null;
  active?: DesktopProductDestination | null;
  mobileActive?: MobileProductDestination;
  pageLabel?: string;
  variant?: "default" | "content-reference" | "portrait-reference";
  children: ReactNode;
};

const destinationIcons: Record<string, KairoIconName> = {
  Home: "home",
  Content: "library",
  Campaigns: "target",
  Discover: "search",
  Calendar: "calendar",
  Results: "results",
  Brand: "brand",
};

const mobileDestinationIcons: Record<string, KairoIconName> = {
  ...destinationIcons,
  Brand: "brain",
};

export async function KairoProductShell({
  brandId,
  workspaceId,
  active,
  mobileActive,
  pageLabel,
  variant = "default",
  children,
}: ProductShellProps) {
  const navigation = buildProductNavigation({ brandId, workspaceId });
  const session = await getSession();
  const workspace = session?.workspaces.find((item) => item.id === workspaceId) ?? session?.workspaces[0];
  const brands = workspace ? await getBrands(workspace.id) : [];
  const notificationResult = brandId ? await getBrandNotifications(brandId).catch(() => null) : null;
  const notifications: ProductNotification[] = (notificationResult?.items ?? []).map(productNotificationView);
  const resolvedActive = active ? simpleDestinationFor(active) : null;
  const mobileSource = mobileActive === "More" && active ? active : mobileActive ?? active;
  const resolvedMobileActive = mobileSource ? simpleDestinationFor(mobileSource) : pageLabel ? null : "Brand";
  const visiblePageLabel = pageLabel ?? (resolvedMobileActive ? displayDestination(resolvedMobileActive) : "Home");
  const addBrandHref = workspaceId
    ? `/brands/new?workspace=${encodeURIComponent(workspaceId)}`
    : "/brands/new";
  const variantClass = variant === "content-reference"
    ? " k-shell--content-reference"
    : variant === "portrait-reference"
      ? " k-shell--portrait-reference"
      : "";

  return (
    <div className={`k-shell${variantClass}`}>
      <a className="skip-link" href="#kairo-main-content">Skip to content</a>

      <aside className="k-shell-sidebar" aria-label="Primary navigation">
        <div className="k-shell-identity">
          <Link href="/" className="wordmark"><KairoLogo /></Link>
          <p className="k-shell-caption">Content Intelligence</p>
        </div>

        <BrandSwitcher brands={brands} currentBrandId={brandId} addBrandHref={addBrandHref} />

        <nav className="k-shell-nav">
          {navigation.desktop.map((item) =>
            item.href ? (
              <Link
                key={item.label}
                className={`k-shell-nav-item ${item.label === resolvedActive ? "active" : ""}`}
                href={item.href}
                aria-current={item.label === resolvedActive ? "page" : undefined}
              >
                <KairoIcon name={destinationIcons[item.label] ?? "brand"} />
                <span>{item.displayLabel}</span>
              </Link>
            ) : (
              <span key={item.label} className="k-shell-nav-item disabled" aria-disabled="true">
                <KairoIcon name={destinationIcons[item.label] ?? "brand"} />
                <span>{item.displayLabel}</span>
                <small>Select Brand</small>
              </span>
            ),
          )}
        </nav>

        <div className="k-shell-sidebar-footer" aria-label="Account utilities">
          <NotificationCentre notifications={notifications} />
          <ThemeToggle />
          <ProfileMenu addBrandHref={addBrandHref} />
        </div>
      </aside>

      <header className="k-shell-mobile-header">
        <div className="k-shell-mobile-context">
          <BrandSwitcher brands={brands} currentBrandId={brandId} addBrandHref={addBrandHref} compact />
          <span className="k-shell-mobile-page">{visiblePageLabel}</span>
        </div>
        <div className="k-shell-mobile-actions" aria-label="Account utilities">
          <NotificationCentre notifications={notifications} />
          <ThemeToggle />
          <ProfileMenu addBrandHref={addBrandHref} />
        </div>
      </header>

      <div className="k-shell-content">{children}</div>

      <nav className="k-shell-mobile-nav" aria-label="Mobile navigation">
        {navigation.mobile.map((item) =>
          item.href ? (
            <Link
              key={item.label}
              href={item.href}
              className={`k-shell-mobile-nav-item ${item.label === resolvedMobileActive ? "active" : ""}`}
              aria-current={item.label === resolvedMobileActive ? "page" : undefined}
            >
              <KairoIcon name={mobileDestinationIcons[item.label] ?? "brand"} />
              <span>{item.displayLabel}</span>
            </Link>
          ) : (
            <span key={item.label} className="k-shell-mobile-nav-item disabled" aria-disabled="true">
              <KairoIcon name={mobileDestinationIcons[item.label] ?? "brand"} />
              <span>{item.displayLabel}</span>
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
      <span className="scope-meta">{workspaceName ?? meta ?? "Private Brand context"}</span>
      <Link className="context-summary-action" href="/brands/new">Add Brand</Link>
    </div>
  );
}
