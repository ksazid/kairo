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
  const existingModes = new Set(accountsResult.accounts.map(connectionModeFor).filter(Boolean) as BrandConnectionOption[]);

  return (
    <KairoProductShell brandId={brand.id} workspaceId={workspace.id} active="Brand" pageLabel="Channels">
      <main id="kairo-main-content" tabIndex={-1} className="workspace-main channels-v2-main">
        <div className="channels-v2-back"><Link href={`/brands/${encoded}/brain`}>← Back to Brand</Link></div>

        <header className="channels-v2-header">
          <div>
            <h1>Channels</h1>
            <p className="lede">Connect the accounts Kairo can publish to and use for results.</p>
          </div>
        </header>

        {messages.notice ? <div className="notice success" role="status">{messages.notice}</div> : null}
        {messages.error ? <div className="notice error" role="alert">{messages.error}</div> : null}

        {!accountsResult.available ? (
          <div className="channels-v2-status" role="alert">
            <strong>Channel status is temporarily unavailable.</strong>
            <span>Existing connections are unchanged. Connection actions stay unavailable until Kairo can read the current account state.</span>
          </div>
        ) : null}

        <section className="channels-v2-section" aria-labelledby="connected-channels-title">
          <header>
            <div>
              <h2 id="connected-channels-title">Connected accounts</h2>
              <p>Each account shows a simple connection state and one next action.</p>
            </div>
          </header>

          <div className="channels-v2-list">
            {accountsResult.accounts.length ? accountsResult.accounts.map((account) => {
              const health = healthById.get(account.id) ?? healthByRef.get(`${account.channel}:${account.accountRef}`);
              return <ChannelRow key={account.id} brandId={brand.id} account={account} health={health} returnTo={channelsPath} />;
            }) : accountsResult.available ? (
              <div className="channels-v2-empty">
                <strong>No channels connected yet.</strong>
                <p>Choose a supported account below when you’re ready to publish or read results.</p>
              </div>
            ) : (
              <div className="channels-v2-empty">
                <strong>Current channels cannot be read right now.</strong>
                <p>Existing connections are left unchanged.</p>
              </div>
            )}
          </div>
        </section>

        <section className="channels-v2-section" aria-labelledby="connect-channel-title">
          <header>
            <div>
              <h2 id="connect-channel-title">Connect a channel</h2>
              <p>Choose an account type. Kairo will return here after connection.</p>
            </div>
          </header>
          <div className="channels-v2-connect-list">
            {!accountsResult.available ? <p className="channels-v2-empty-copy">Connection changes are unavailable until current channel state can be verified.</p> : (
              <>
                {!existingModes.has("instagram") ? <ConnectOption brandId={brand.id} mode="instagram" title="Instagram" description="Connect an Instagram Professional account." returnTo={channelsPath} /> : null}
                {!existingModes.has("facebook-instagram") ? <ConnectOption brandId={brand.id} mode="facebook-instagram" title="Facebook + Instagram" description="Connect a Facebook Page and its linked Instagram Professional account." returnTo={channelsPath} /> : null}
                {!existingModes.has("facebook") ? <ConnectOption brandId={brand.id} mode="facebook" title="Facebook" description="Connect an eligible Facebook Page." returnTo={channelsPath} /> : null}
                {existingModes.size >= 3 ? <p className="channels-v2-empty-copy">All currently supported channel types are connected.</p> : null}
              </>
            )}
          </div>
        </section>
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

  return (
    <article className="channels-v2-row">
      <div className="channels-v2-identity">
        <span className="channels-v2-channel">{friendly(account.channel)}</span>
        <strong>{account.displayName}</strong>
        <small>{account.status === "disabled" ? "This account is currently disabled." : "Available to Kairo according to its connected capabilities."}</small>
      </div>
      <div className="channels-v2-row-state">
        <span className={`channels-v2-state ${reconnect ? "attention" : account.status}`}>{status}</span>
        {health?.lastVerifiedAt ? <small>Checked {friendlyDate(health.lastVerifiedAt)}</small> : null}
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
                <div><dt>Results</dt><dd>{resultsLabel(account, health)}</dd></div>
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
  if (!capabilities.length) return "Not available";
  const names = capabilities.map((capability) => capability.replace("publish-", "")).map(friendly);
  return names.join(" · ");
}

function resultsLabel(account: ChannelAccountView, health?: MetaConnectionHealth) {
  if (account.channel !== "instagram") return "Not reported";
  if (!health) return "Status unavailable";
  if (!health.healthy) return "Needs attention";
  return "Available";
}

function friendly(value: string) {
  if (value.toLowerCase() === "linkedin") return "LinkedIn";
  return value.replace(/([A-Z])/g, " $1").replaceAll("-", " ").replace(/^./, (character) => character.toUpperCase());
}

function friendlyDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "recently";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
