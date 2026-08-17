import Link from "next/link";
import { getBrand } from "../../../../src/lib/kairo-api";
import { KairoSidebar } from "../ideas/page";
import { PilotMobileNav } from "../../../pilot-mobile-nav";

type Params = Promise<{ brandId: string }>;

export default async function MorePage({ params }: { params: Params }) {
  const { brandId } = await params;
  const brand = await getBrand(brandId);
  if (!brand) return <main className="auth-page"><section className="auth-card"><h1>Brand not found.</h1><Link className="primary-button" href="/">Return to Today</Link></section></main>;
  const base = `/brands/${encodeURIComponent(brand.id)}`;
  const destinations = [
    { title: "Campaigns & Content Studio", description: "Develop selected Angles, review immutable versions and record human approval.", href: `${base}/campaigns` },
    { title: "Format intelligence", description: "Compare Kairo formats by channel fit, objective and production effort before you commit to an execution.", href: `${base}/formats` },
    { title: "Performance", description: "Inspect measured channel evidence, reconnect Instagram and review Candidate Learnings.", href: `${base}/performance` },
    { title: "Brand Brain", description: "Review the private Brand context, knowledge and boundaries Kairo may rely on.", href: `${base}/brain` },
    { title: "Operations", description: "Inspect retries, intervention states and pilot operational health.", href: `${base}/operations` },
  ];
  return <div className="app-shell">
    <KairoSidebar brandId={brand.id} active="" />
    <main className="workspace-main ideas-main">
      <header className="topbar"><div><p className="eyebrow">More</p><h1>Manage the rest of the pilot workflow.</h1><p className="lede">These are existing governed Kairo surfaces, grouped here so the complete workflow remains reachable on smaller screens.</p></div><div className="scope-picker"><span className="scope-label">Brand</span><strong>{brand.name}</strong><span className="scope-meta">Private Brand scope</span></div></header>
      <section className="ideas-list" aria-label="More Kairo areas">{destinations.map((item) => <Link className="idea-row" href={item.href} key={item.href}><div><h2>{item.title}</h2><p>{item.description}</p></div><span aria-hidden="true">→</span></Link>)}</section>
    </main>
    <PilotMobileNav brandId={brand.id} active="More" />
  </div>;
}
