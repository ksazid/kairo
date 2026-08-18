import Link from "next/link";
import { getBrand } from "../../../../src/lib/kairo-api";
import { KairoProductShell, KairoScopePicker } from "../../../kairo-product-shell";
import "../../../operations.css";

type Params = Promise<{ brandId: string }>;

type Destination = { title: string; description: string; href: string };

export default async function MorePage({ params }: { params: Params }) {
  const { brandId } = await params;
  const brand = await getBrand(brandId);
  if (!brand) return <main className="auth-page"><section className="auth-card"><h1>Brand not found.</h1><Link className="primary-button" href="/">Return to Today</Link></section></main>;
  const base = `/brands/${encodeURIComponent(brand.id)}`;
  const groups: { label: string; description: string; items: Destination[] }[] = [
    {
      label: "Create & review",
      description: "Continue deeper work that does not belong in the five-item mobile navigation.",
      items: [
        { title: "Campaigns & Content Studio", description: "Develop selected Angles, edit content, review versions and approve the final execution.", href: `${base}/campaigns` },
        { title: "Performance", description: "Understand what happened, why it may have happened and what to try next.", href: `${base}/performance` },
      ],
    },
    {
      label: "Brand & channel management",
      description: "Manage Brand context, connected destinations and reusable execution guidance.",
      items: [
        { title: "Brand Brain", description: "Review confirmed Brand context, Kairo suggestions, boundaries and Knowledge sources.", href: `${base}/brain` },
        { title: "Channels", description: "Manage connected channel accounts and account groups without crowding Performance.", href: `${base}/channels` },
        { title: "Format intelligence", description: "Compare approved content formats by channel fit, objective and production effort.", href: `${base}/formats` },
      ],
    },
    {
      label: "Internal pilot controls",
      description: "Operator-only diagnostics stay separate from the normal creator workflow.",
      items: [
        { title: "Pilot Operations", description: "Handle safe retries, manual-review failures, budget issues and automation controls.", href: `${base}/operations` },
      ],
    },
  ];

  return <KairoProductShell brandId={brand.id} workspaceId={brand.workspaceId} active={null} mobileActive="More">
    <main className="workspace-main more-main" id="kairo-main-content">
      <header className="topbar more-topbar"><div><p className="eyebrow">More</p><h1>Everything else, without cluttering the main workflow.</h1><p className="lede">Use More for secondary work and management. Today, Discover, Ideas and Calendar stay focused on frequent decisions.</p></div><KairoScopePicker brandName={brand.name} meta="Secondary Brand tools" /></header>
      <div className="more-groups">
        {groups.map((group) => <section className="more-section" key={group.label} aria-labelledby={`more-${slug(group.label)}`}>
          <div className="more-section-heading"><p className="eyebrow">{group.label}</p><h2 id={`more-${slug(group.label)}`}>{group.label}</h2><p>{group.description}</p></div>
          <div className="more-list">{group.items.map((item) => <Link className="more-row" href={item.href} key={item.href}><div><h3>{item.title}</h3><p>{item.description}</p></div><span aria-hidden="true">→</span></Link>)}</div>
        </section>)}
      </div>
      <div className="more-settings-note" aria-label="Settings status"><div><strong>Settings</strong><p>Account and product preferences remain a later Kairo surface.</p></div><span>Later</span></div>
    </main>
  </KairoProductShell>;
}

function slug(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
