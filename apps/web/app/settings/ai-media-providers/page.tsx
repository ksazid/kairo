import Link from "next/link";
import { redirect } from "next/navigation";
import { getBrands, getSession } from "../../../src/lib/kairo-api";
import { getBrandPresenter } from "../../../src/lib/presenter-api";
import { KairoProductShell } from "../../kairo-product-shell";
import styles from "./providers.module.css";

type SearchParams = Promise<{ tab?: string; brand?: string }>;
type ProviderTab = "ai" | "media";

type ProviderRow = {
  name: string;
  description: string;
  badge: string;
  status: string;
  action: "Manage" | "Connect" | "Add provider";
  id?: string;
};

const aiProviders: ProviderRow[] = [
  {
    name: "Ollama (Open Source)",
    description: "Approved open-source-first default direction for AI features.",
    badge: "Approved default",
    status: "Configuration UI pending",
    action: "Manage",
  },
  {
    name: "OpenAI",
    description: "Optional third-party AI provider.",
    badge: "Third-party",
    status: "Not configured",
    action: "Connect",
  },
  {
    name: "Azure OpenAI",
    description: "Optional provider using your Azure configuration.",
    badge: "BYOK",
    status: "Not configured",
    action: "Connect",
  },
  {
    name: "Anthropic Claude",
    description: "Optional third-party AI provider.",
    badge: "Third-party",
    status: "Not configured",
    action: "Connect",
  },
  {
    name: "Custom Provider",
    description: "Optional custom or self-hosted AI endpoint.",
    badge: "Custom",
    status: "Not configured",
    action: "Connect",
  },
];

const baseMediaProviders: ProviderRow[] = [
  {
    name: "FLUX.1 Schnell",
    description: "Approved open-source image-provider direction.",
    badge: "Image",
    status: "Configuration UI pending",
    action: "Manage",
  },
  {
    name: "Wan 2.2",
    description: "Approved open-source video-provider direction.",
    badge: "Video",
    status: "Configuration UI pending",
    action: "Manage",
  },
  {
    name: "Kokoro",
    description: "Approved open-source voice-provider direction.",
    badge: "Voice",
    status: "Configuration UI pending",
    action: "Manage",
  },
  {
    name: "ACE-Step",
    description: "Approved open-source music-provider direction.",
    badge: "Music",
    status: "Configuration UI pending",
    action: "Manage",
  },
  {
    name: "MuseTalk",
    description: "Approved open-source Avatar-provider direction.",
    badge: "Avatar",
    status: "Not configured",
    action: "Manage",
    id: "avatar-provider",
  },
  {
    name: "Custom / self-hosted",
    description: "Add a compatible custom media provider after the approved setup flow is implemented.",
    badge: "Custom",
    status: "Not configured",
    action: "Add provider",
  },
];

export default async function AiMediaProvidersPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getSession();
  if (!session) redirect("/auth/login?returnTo=/settings/ai-media-providers");

  const workspace = session.workspaces[0];
  if (!workspace) redirect("/onboarding");
  const [brands, query] = await Promise.all([
    getBrands(workspace.id).catch(() => []),
    searchParams,
  ]);
  const brand = query.brand
    ? brands.find((item) => item.id === query.brand) ?? brands[0] ?? null
    : brands[0] ?? null;
  const tab: ProviderTab = query.tab === "media" ? "media" : "ai";
  const brandQuery = brand ? `&brand=${encodeURIComponent(brand.id)}` : "";

  const avatarState = brand
    ? await getBrandPresenter(brand.id).catch(() => null)
    : null;
  const avatarStatus = avatarState?.eligibility?.status === "eligible"
    ? "Ready for this Brand"
    : avatarState?.capabilities?.providerConfigured
      ? "Needs attention"
      : "Not configured";
  const mediaProviders = baseMediaProviders.map((provider) =>
    provider.id === "avatar-provider" ? { ...provider, status: avatarStatus } : provider,
  );

  return (
    <KairoProductShell brandId={brand?.id} workspaceId={workspace.id} pageLabel="AI & Media Providers">
      <main id="kairo-main-content" tabIndex={-1} className={`${styles.providers} workspace-main`}>
        <div className={styles.breadcrumbs}>
          <Link href="/settings">Settings</Link>
          <span aria-hidden="true">›</span>
          <span>AI &amp; Media Providers</span>
        </div>

        <header className={styles.header}>
          <div>
            <h1>AI &amp; Media Providers</h1>
            <p>Manage the AI and media providers Kairo uses to generate content.</p>
          </div>
          <button className="secondary-button" type="button" disabled title="Provider settings needs a governed configuration contract.">
            Provider settings
          </button>
        </header>

        <section className={styles.guidance} aria-label="Provider strategy">
          <div>
            <strong>Kairo uses open-source providers by default.</strong>
            <span>You can add third-party, BYOK, custom or self-hosted providers as alternatives or fallbacks.</span>
          </div>
          <button type="button" disabled title="Provider documentation is not implemented yet.">Learn more</button>
        </section>

        <nav className={styles.tabs} aria-label="Provider type">
          <Link href={`/settings/ai-media-providers?tab=ai${brandQuery}`} aria-current={tab === "ai" ? "page" : undefined} data-active={tab === "ai"}>AI Providers</Link>
          <Link href={`/settings/ai-media-providers?tab=media${brandQuery}`} aria-current={tab === "media" ? "page" : undefined} data-active={tab === "media"}>Media Providers</Link>
        </nav>

        {tab === "ai" ? (
          <ProviderList
            title="AI Providers"
            description="The approved provider catalog is visible now. Connection and credential management remain disabled until the provider configuration backend is implemented."
            providers={aiProviders}
          />
        ) : (
          <ProviderList
            title="Media Providers"
            description="Capability-first provider choices are visible now. Kairo does not claim Ready/Healthy unless a governed runtime capability can verify it."
            providers={mediaProviders}
          />
        )}

        <aside className={styles.pending} role="note">
          <strong>Provider configuration is intentionally not simulated.</strong>
          <p>
            Manage, Connect, Add provider, Test provider and credential actions stay disabled until their secure server-side flows exist.
            The saved implementation list is in the VS-95 deferred-interactions record.
          </p>
        </aside>
      </main>
    </KairoProductShell>
  );
}

function ProviderList({
  title,
  description,
  providers,
}: {
  title: string;
  description: string;
  providers: ProviderRow[];
}) {
  return (
    <section className={styles.section} aria-labelledby="provider-list-title">
      <header>
        <h2 id="provider-list-title">{title}</h2>
        <p>{description}</p>
      </header>
      <div className={styles.list}>
        {providers.map((provider) => (
          <article className={styles.row} id={provider.id} key={provider.name}>
            <div className={styles.identity}>
              <span className={styles.mark} aria-hidden="true">{provider.badge.slice(0, 1)}</span>
              <div>
                <div className={styles.nameLine}>
                  <strong>{provider.name}</strong>
                  <span className={styles.badge}>{provider.badge}</span>
                </div>
                <p>{provider.description}</p>
              </div>
            </div>
            <span className={styles.status}>{provider.status}</span>
            <button
              className="secondary-button"
              type="button"
              disabled
              title={`${provider.action} requires the provider configuration flow recorded for later implementation.`}
            >
              {provider.action}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
