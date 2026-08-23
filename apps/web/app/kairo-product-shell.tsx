import Link from "next/link";
import type { ReactNode } from "react";
import { getBrandNotifications, getBrands, getSession } from "../src/lib/kairo-api";
import { KairoIcon, KairoLogo, type KairoIconName } from "./kairo-icons";
import { BrandSwitcher } from "./brand-switcher";
import { ProductGuide } from "./product-guide";
import { ProfileMenu } from "./profile-menu";
import { ThemeToggle } from "./theme-toggle";
import { NotificationCentre, type ProductNotification } from "./ui-states";
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

const destinationIcons: Record<string, KairoIconName> = {
  Home: "home",
  Content: "library",
  Calendar: "calendar",
  Results: "results",
  Brand: "brain",
};

export async function KairoProductShell({
  brandId,
  workspaceId,
  active,
  mobileActive,
  children,
}: ProductShellProps) {
  const navigation = buildProductNavigation({ brandId, workspaceId });
  const session = await getSession();
  const workspace = session?.workspaces.find(item => item.id === workspaceId) ?? session?.workspaces[0];
  const brands = workspace ? await getBrands(workspace.id) : [];
  const currentBrand = brands.find(item => item.id === brandId) ?? null;
  const notificationResult = brandId ? await getBrandNotifications(brandId).catch(() => null) : null;
  const notifications: ProductNotification[] = (notificationResult?.items ?? []).map(item => notificationView(item));
  const resolvedActive = active ? simpleDestinationFor(active) : null;
  const resolvedMobileActive = simpleDestinationFor(mobileActive ?? active ?? "Brand");
  const addBrandHref = workspaceId
    ? `/brands/new?workspace=${encodeURIComponent(workspaceId)}`
    : "/brands/new";

  return (
    <div className="k-shell">
      <a className="skip-link" href="#kairo-main-content">Skip to content</a>

      <aside className="k-shell-sidebar" aria-label="Primary navigation">
        <div className="k-shell-identity">
          <Link href="/" className="wordmark"><KairoLogo /></Link>
          <p className="k-shell-caption">Content Intelligence</p>
        </div>

        <BrandSwitcher brands={brands} currentBrandId={brandId} addBrandHref={addBrandHref} />

        <nav className="k-shell-nav">
          {navigation.desktop.map(item =>
            item.href ? (
              <Link
                key={item.label}
                className={`k-shell-nav-item ${item.label === resolvedActive ? "active" : ""}`}
                href={item.href}
                aria-current={item.label === resolvedActive ? "page" : undefined}
              >
                <KairoIcon name={destinationIcons[item.label] ?? "brand"} />
                <span>{item.label}</span>
              </Link>
            ) : (
              <span key={item.label} className="k-shell-nav-item disabled" aria-disabled="true">
                <KairoIcon name={destinationIcons[item.label] ?? "brand"} />
                <span>{item.label}</span>
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
          <span className="k-shell-mobile-page">{resolvedMobileActive}</span>
        </div>
        <div className="k-shell-mobile-actions" aria-label="Account utilities">
          <NotificationCentre notifications={notifications} />
          <ThemeToggle />
          <ProfileMenu addBrandHref={addBrandHref} />
        </div>
      </header>

      <div className="k-shell-content">
        <nav className="k-shell-breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Kairo</Link>
          <KairoIcon name="chevron" />
          {currentBrand
            ? <Link href={`/?workspace=${encodeURIComponent(currentBrand.workspaceId)}&brand=${encodeURIComponent(currentBrand.id)}`}>{currentBrand.name}</Link>
            : <span>Brand</span>}
          <KairoIcon name="chevron" />
          <span aria-current="page">{resolvedActive ?? "Home"}</span>
        </nav>
        <ProductGuide />
        {children}
      </div>

      <nav className="k-shell-mobile-nav" aria-label="Mobile navigation">
        {navigation.mobile.map(item =>
          item.href ? (
            <Link
              key={item.label}
              href={item.href}
              className={`k-shell-mobile-nav-item ${item.label === resolvedMobileActive ? "active" : ""}`}
              aria-current={item.label === resolvedMobileActive ? "page" : undefined}
            >
              <KairoIcon name={destinationIcons[item.label] ?? "brand"} />
              <span>{item.label}</span>
            </Link>
          ) : (
            <span key={item.label} className="k-shell-mobile-nav-item disabled" aria-disabled="true">
              <KairoIcon name={destinationIcons[item.label] ?? "brand"} />
              <span>{item.label}</span>
            </span>
          ),
        )}
      </nav>
    </div>
  );
}

function notificationView(item: {
  id: string;
  kind: string;
  occurredAt: string;
  context: { campaignId?: string; assetId?: string; channel?: string; accountRef?: string; failureReason?: string };
  brandId: string;
}): ProductNotification {
  const base = `/brands/${encodeURIComponent(item.brandId)}`;
  if (item.kind === "publishing-failed") {
    return {
      id: item.id,
      title: "Publishing failed",
      detail: item.context.failureReason ?? "Open Calendar to review the failed publish.",
      occurredAt: new Date(item.occurredAt).toLocaleString(),
      href: `${base}/calendar`,
      unread: true,
    };
  }
  if (item.kind === "connection-reconnect-required") {
    return {
      id: item.id,
      title: `${item.context.channel ?? "Channel"} needs reconnection`,
      detail: item.context.accountRef ?? "Reconnect the publishing destination.",
      occurredAt: new Date(item.occurredAt).toLocaleString(),
      href: `${base}/performance`,
      unread: true,
    };
  }
  return {
    id: item.id,
    title: "Content ready for approval",
    detail: "A reviewed asset is waiting for your decision.",
    occurredAt: new Date(item.occurredAt).toLocaleString(),
    href: item.context.campaignId
      ? `${base}/campaigns/${encodeURIComponent(item.context.campaignId)}`
      : `${base}/campaigns`,
    unread: true,
  };
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
