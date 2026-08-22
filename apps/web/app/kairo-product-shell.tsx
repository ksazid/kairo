import Link from "next/link";
import type { ReactNode } from "react";
import { getBrands, getCampaigns, getSession } from "../src/lib/kairo-api";
import { KairoIcon, KairoLogo, type KairoIconName } from "./kairo-icons";
import { ShellControls } from "./shell-controls";
import { BrandSwitcher } from "./brand-switcher";
import { CommandPalette } from "./command-palette";
import { ProductGuide, ReplayGuideButton } from "./product-guide";
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

const destinationIcons:Record<string,KairoIconName>={Home:"home",Create:"create",Library:"library",Calendar:"calendar",Results:"results",Brand:"brain"};

export async function KairoProductShell({
  brandId,
  workspaceId,
  active,
  mobileActive,
  children,
}: ProductShellProps) {
  const navigation = buildProductNavigation({ brandId, workspaceId });
  const session=await getSession();
  const workspace=session?.workspaces.find(item=>item.id===workspaceId)??session?.workspaces[0];
  const brands=workspace?await getBrands(workspace.id):[];
  const currentBrand=brands.find(item=>item.id===brandId)??null;
  const campaigns=brandId?await getCampaigns(brandId).catch(()=>[]):[];
  const commandItems=[...navigation.desktop.filter(item=>item.href).map(item=>({label:item.label,detail:currentBrand?.name??"Kairo",href:item.href!,icon:(destinationIcons[item.label]??"brand") as KairoIconName})),...brands.map(brand=>({label:brand.name,detail:"Switch Brand",href:`/?workspace=${encodeURIComponent(brand.workspaceId)}&brand=${encodeURIComponent(brand.id)}`,icon:"brand" as KairoIconName})),...campaigns.map(campaign=>({label:campaign.name,detail:"Campaign",href:`/brands/${encodeURIComponent(campaign.brandId)}/campaigns/${encodeURIComponent(campaign.id)}`,icon:"library" as KairoIconName}))];
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
          <Link href="/" className="wordmark"><KairoLogo /></Link>
          <p className="sidebar-caption">Content Intelligence</p>
        </div>
        <BrandSwitcher brands={brands} currentBrandId={brandId} addBrandHref={addBrandHref}/>
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
                <KairoIcon name={destinationIcons[item.label] ?? "brand"}/><span>{item.label}</span>
              </Link>
            ) : (
              <span
                key={item.label}
                className="nav-item disabled"
                aria-disabled="true"
              >
                <KairoIcon name={destinationIcons[item.label] ?? "brand"}/><span>{item.label}</span>
                <small>Select Brand</small>
              </span>
            ),
          )}
        </nav>
        <div className="sidebar-footer">
          <CommandPalette items={commandItems}/>
          <ShellControls />
          <Link className="nav-item" href={addBrandHref}>
            <KairoIcon name="plus"/><span>Add Brand</span>
          </Link>
          <ReplayGuideButton />
          <span className="nav-item disabled" aria-disabled="true">
            <KairoIcon name="settings"/><span>Settings</span><small>Later</small>
          </span>
          <a className="nav-item" href="/auth/logout">
            <KairoIcon name="logout"/><span>Sign out</span>
          </a>
        </div>
      </aside>
      <div className="mobile-brand-bar">
        <BrandSwitcher brands={brands} currentBrandId={brandId} addBrandHref={addBrandHref} compact/>
        <CommandPalette items={commandItems}/>
        <ShellControls />
      </div>
      <div className="shell-content">
        <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Kairo</Link><KairoIcon name="chevron"/>{currentBrand?<Link href={`/?workspace=${encodeURIComponent(currentBrand.workspaceId)}&brand=${encodeURIComponent(currentBrand.id)}`}>{currentBrand.name}</Link>:<span>Brand</span>}<KairoIcon name="chevron"/><span aria-current="page">{resolvedActive??"Home"}</span></nav>
        <ProductGuide />
        {children}
      </div>

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
              <KairoIcon name={destinationIcons[item.label] ?? "brand"}/><span>{item.label}</span>
            </Link>
          ) : (
            <span
              key={item.label}
              className="mobile-nav-item disabled"
              aria-disabled="true"
            >
              <KairoIcon name={destinationIcons[item.label] ?? "brand"}/><span>{item.label}</span>
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
