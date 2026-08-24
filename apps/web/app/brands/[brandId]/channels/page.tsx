import Link from "next/link";
import { redirect } from "next/navigation";
import { getBrand, getChannelAccounts, getSession, type ChannelAccountView } from "../../../../src/lib/kairo-api";
import { getMetaConnectionHealth, type MetaConnectionHealth } from "../../../../src/lib/meta-connection-api";
import { connectionStartPath, type BrandConnectionOption } from "../../../../src/lib/brand-connection-plan";
import { KairoProductShell } from "../../../kairo-product-shell";
import { disconnectMetaConnectionAction } from "../connections/actions";
import "./channels-v2.css";

type Params = Promise<{ brandId: string }>;
type SearchParams = Promise<{ notice?: string; error?: string }>;

export default async function ChannelsPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const session = await getSession();
  if (!session) redirect("/");
  const { brandId } = await params;
  const brand = await getBrand(brandId);
  if (!brand) redirect("/");
  const workspace = session.workspaces.find((item) => item.id === brand.workspaceId);
  if (!workspace) redirect("/");

  const [accountsResult, healthResult, messages] = await Promise.all([
    getChannelAccounts(brand.id).then((accounts) => ({ available: true as const, accounts })).catch(() => ({ available: false as const, accounts: [] })),
    getMetaConnectionHealth(brand.id).then((accounts) => ({ available: true as const, accounts })).catch(() => ({ available: false as const, accounts: [] })),
    searchParams,
  ]);

  const encoded = encodeURIComponent(brand.id);
  const channelsPath = `/brands/${encoded}/channels`;
  const healthById = new Map(healthResult.accounts.map((account) => [account.id, account]));
  const healthByRef = new Map(healthResult.accounts.map((account) => [`${account.channel}:${account.accountRef}`, account]));
  const connectedCount = accountsResult.accounts.filter((account) => account.status === "connected").length;
  const attentionCount = accountsResult.accounts.filter((account) => account.status === "reconnect-required").length;
  const existingModes = new Set(accountsResult.accounts.map(connectionModeFor).filter(Boolean) as BrandConnectionOption[]);

  return (
    <KairoProductShell brandId={brand.id} workspaceId={workspace.id} active="Brand" pageLabel="Channels">
      <main id="kairo-main-content" tabIndex={-1} className="workspace-main channels-v2-main">
        <div className="channels-v2-back"><Link href={`/brands/${encoded}/brain`}>← Brand</Link></div>

        <header className="channels-v2-header">
          <div>
            <p className="eyebrow">Brand · Channels</p>
            <h1>Publishing &amp; Insights destinations</h1>
            <p>Manage the accounts Kairo can publish to and use for provider-backed Insights. Credentials remain behind the connection boundary.</p>
          </div>
          <div className="channels-v2-summary" aria-label="Channel connection summary">
            {accountsResult.available ? (
              <>
                <span><strong>{connectedCount}</strong> Connected</span>
                <span><strong>{attentionCount}</strong> Need attention</span>
              </>
            ) : <span><strong>—</strong> Status unavailable</span>}
          </div>
        </header>

        {messages.notice ? <div className="notice success" role="status">{messages.notice}</div> : null}
        {messages.error ? <div className="notice error" role="alert">{messages.error}</div> : null}

        {!accountsResult.available ? (
          <div className="channels-v2-status" role="alert">
            <strong>Channel status is temporarily unavailable.</strong>
            <span>Kairo is not treating missing status as a disconnected account. Connection changes stay unavailable until current account state can be read.</span>
          </div>
        ) : null}

        <section className="channels-v2-section" aria-labelledby="connected-channels-title">
          <header>
            <div>
              <p className="eyebrow">Destinations</p>
              <h2 id="connected-channels-title">Channel accounts</h2>
              <p>Each destination keeps its own approval and publishing authority.</p>
            </div>
          </header>

          <div className="channels-v2-list">
            {accountsResult.accounts.length ? accountsResult.accounts.map((account) => {
              const health = healthById.get(account.id) ?? healthByRef.get(`${account.channel}:${account.accountRef}`);
              return <ChannelRow key={account.id} brandId={brand.id} account={account} health={health} returnTo={channelsPath} />;
            }) : accountsResult.available ? (
              <div className="channels-v2-empty">
                <strong>No connected destinations yet.</strong>
                <p>Choose one of the supported connection paths below. Kairo will only show eligible destinations during authorization.</p>
              </div>
            ) : (
              <div className="channels-v2-empty">
                <strong>Current destinations cannot be read right now.</strong>
                <p>Existing connections are left unchanged. Try again before reconnecting or adding another destination.</p>
              </div>
            )}
          </div>
        </section>

        <section className="channels-v2-section" aria-labelledby="connect-channel-title">
          <header>
            <div>
              <p className="eyebrow">Connect</p>
              <h2 id="connect-channel-title">Add a destination</h2>
              <p>Authorization stays focused: connect, choose a destination only when needed, then return here.</p>
            </div>
          </header>
          <div className="channels-v2-connect-list">
            {!accountsResult.available ? <p className="channels-v2-empty-copy">Connection changes are unavailable until Kairo can verify the current destination list.</p> : (
              <>
                {!existingModes.has("instagram") ? <ConnectOption brandId={brand.id} mode="instagram" title="Instagram" description="Instagram Professional account using Instagram Login." returnTo={channelsPath} /> : null}
                {!existingModes.has("facebook-instagram") ? <ConnectOption brandId={brand.id} mode="facebook-instagram" title="Facebook + Instagram" description="Choose a Facebook Page and its linked Instagram Professional account." returnTo={channelsPath} /> : null}
                {!existingModes.has("facebook") ? <ConnectOption brandId={brand.id} mode="facebook" title="Facebook" description="Connect an eligible Facebook Page for publishing." returnTo={channelsPath} /> : null}
                {existingModes.size >= 3 ? <p className="channels-v2-empty-copy">All currently supported Meta connection paths are already represented.</p> : null}
              </>
            )}
          </div>
        </section>

        <details className="channels-v2-advanced">
          <summary>Advanced routing</summary>
          <div>
            <p>Account groups are optional convenience for repeated multi-destination selections. They never bypass destination-specific review or approval.</p>
            <Link className="secondary-button" href={`/brands/${encoded}/channels/groups`}>Manage account groups</Link>
          </div>
        </details>
      </main>
    </KairoProductShell>
  );
}

function ChannelRow({ brandId, account, health, returnTo }: {
  brandId: string;
  account: ChannelAccountView;
  health?: MetaConnectionHealth;
  returnTo: string;
}) {
  const mode = connectionModeFor(account);
  const reconnect = account.status === "reconnect-required" || health?.status === "reconnect-required";
  const status = account.status === "disabled" ? "Disabled" : reconnect ? "Reconnect required" : "Connected";
  const insights = insightsLabel(account, health);

  return (
    <article className="channels-v2-row">
      <div className="channels-v2-identity">
        <span className="channels-v2-channel">{friendly(account.channel)}</span>
        <strong>{account.displayName}</strong>
        <small>{publishSummary(account.capabilities)} · {insights}</small>
      </div>
      <div className="channels-v2-row-state">
        <span className={`channels-v2-state ${reconnect ? "attention" : account.status}`}>{status}</span>
        {health?.lastVerifiedAt ? <small>Verified {friendlyDate(health.lastVerifiedAt)}</small> : null}
      </div>
      <div className="channels-v2-row-action">
        {reconnect && mode ? (
          <Link className="primary-button" href={connectionStartPath(brandId, mode, returnTo)}>Reconnect</Link>
        ) : (
          <details className="channels-v2-manage">
            <summary className="secondary-button">Manage</summary>
            <div>
              <dl>
                <div><dt>Account</dt><dd>{account.displayName}</dd></div>
                <div><dt>Publishing</dt><dd>{publishSummary(account.capabilities)}</dd></div>
                <div><dt>Insights</dt><dd>{insights}</dd></div>
                {health?.lastSourceSyncAt ? <div><dt>Brand source sync</dt><dd>{friendlyDate(health.lastSourceSyncAt)}{health.sourceStatus ? ` · ${friendly(health.sourceStatus)}` : ""}</dd></div> : null}
                <div><dt>Destination reference</dt><dd>{account.accountRef}</dd></div>
              </dl>
              {health ? (
                <form action={disconnectMetaConnectionAction.bind(null, brandId, account.id, returnTo)}>
                  <button className="tertiary-button" type="submit">Disconnect</button>
                </form>
              ) : null}
            </div>
          </details>
        )}
      </div>
    </article>
  );
}

function ConnectOption({ brandId, mode, title, description, returnTo }: {
  brandId: string;
  mode: BrandConnectionOption;
  title: string;
  description: string;
  returnTo: string;
}) {
  return (
    <article className="channels-v2-connect-row">
      <div><strong>{title}</strong><span>{description}</span></div>
      <Link className="secondary-button" href={connectionStartPath(brandId, mode, returnTo)}>Connect</Link>
    </article>
  );
}

function connectionModeFor(account: ChannelAccountView): BrandConnectionOption | undefined {
  if (account.channel === "instagram" && account.authMethod === "instagram-login") return "instagram";
  if (account.channel === "instagram" && account.authMethod === "facebook-login") return "facebook-instagram";
  if (account.channel === "facebook" && account.authMethod === "facebook-login") return "facebook";
  return undefined;
}

function publishSummary(capabilities: ChannelAccountView["capabilities"]) {
  if (!capabilities.length) return "Publishing unavailable";
  const names = capabilities.map((capability) => capability.replace("publish-", "")).map(friendly);
  return `Publish ${names.join(" · ")}`;
}

function insightsLabel(account: ChannelAccountView, health?: MetaConnectionHealth) {
  if (account.channel !== "instagram") return "Insights availability not reported";
  if (!health) return "Insights status unavailable";
  if (!health.healthy) return "Insights need attention";
  return "Insights available";
}

function friendly(value: string) {
  return value.replace(/([A-Z])/g, " $1").replaceAll("-", " ").replace(/^./, (character) => character.toUpperCase());
}

function friendlyDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "recently";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
