import Link from "next/link";
import { getBrand, getChannelAccounts } from "../../../../../src/lib/kairo-api";
import { getChannelAccountGroups } from "../../../../../src/lib/channel-account-groups-api";
import { KairoProductShell } from "../../../../kairo-product-shell";
import { createGroupAction, deleteGroupAction, updateGroupAction } from "./actions";
import "../../../../channels.css";

type Params = Promise<{ brandId: string }>;
type Search = Promise<{ notice?: string; error?: string }>;

export default async function AccountGroupsPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { brandId } = await params;
  const [brand, accounts, groups, messages] = await Promise.all([
    getBrand(brandId),
    getChannelAccounts(brandId),
    getChannelAccountGroups(brandId),
    searchParams,
  ]);
  if (!brand) return null;

  const available = accounts.filter((account) => account.status !== "disabled");
  const connected = available.filter((account) => account.status === "connected");
  const channelsHref = `/brands/${encodeURIComponent(brand.id)}/channels`;

  return (
    <KairoProductShell brandId={brand.id} workspaceId={brand.workspaceId} active="Brand" pageLabel="Account groups">
      <main id="kairo-main-content" tabIndex={-1} className="workspace-main channels-main">
        <div className="channels-toolbar">
          <div><Link className="back-link" href={channelsHref}>← Channels</Link></div>
        </div>

        <header className="channels-hero">
          <div><p className="eyebrow">Brand · Channels</p><h1>Account groups</h1><p className="lede">Save repeated destination sets without changing approval authority. Every account still receives its own approval and publish command.</p></div>
          <span className="channel-count">{connected.length} connected · {groups.length} group{groups.length === 1 ? "" : "s"}</span>
        </header>

        {messages.notice ? <p className="notice success" role="status">{messages.notice}</p> : null}
        {messages.error ? <p className="notice error" role="alert">{messages.error}</p> : null}

        <section className="channels-section" aria-labelledby="destinations-title">
          <div className="channels-section-heading"><div><p className="eyebrow">Available destinations</p><h2 id="destinations-title">Accounts this Brand can target</h2><p>Reconnect-required accounts stay visible but are never presented as healthy destinations.</p></div><span className="channel-count">{available.length} available</span></div>
          {available.length ? <div className="destination-list">{available.map((account) => <div className="destination-row" key={account.id}><div><span className={`destination-state ${account.status === "connected" ? "connected" : "attention"}`}>{label(account.status)}</span><strong>{account.displayName}</strong><small>{label(account.channel)} · {account.accountRef}</small></div><span className="destination-capabilities">{account.capabilities.length ? account.capabilities.map(label).join(" · ") : "No publish capabilities"}</span></div>)}</div> : <div className="channels-empty"><strong>No channel destinations available.</strong><p>Connect a supported channel before creating a reusable group.</p><Link className="primary-button" href={channelsHref}>Open Channels</Link></div>}
        </section>

        <section className="channels-section" aria-labelledby="groups-title">
          <div className="channels-section-heading"><div><p className="eyebrow">Reusable destination sets</p><h2 id="groups-title">Groups</h2><p>Create one only when the same accounts are selected repeatedly.</p></div>{available.length ? <details className="create-group-disclosure"><summary className="primary-button">Create account group</summary><GroupForm brandId={brand.id} available={available} /></details> : null}</div>

          {groups.length ? <div className="group-list">{groups.map((group) => {
            const members = available.filter((account) => group.memberAccountIds.includes(account.id));
            return <article className="group-row" key={group.id} aria-labelledby={`group-${group.id}`}>
              <div className="group-summary"><div><span className="group-kicker">Account group</span><h3 id={`group-${group.id}`}>{group.name}</h3><p>{members.length ? members.map((account) => account.displayName).join(" · ") : "No currently available destinations"}</p></div><span className="channel-count">{group.memberAccountIds.length} destination{group.memberAccountIds.length === 1 ? "" : "s"}</span></div>
              <details className="group-edit-disclosure"><summary>Edit destinations</summary><form className="channel-form" action={updateGroupAction.bind(null, brand.id, group.id)}><label>Group name<input name="name" defaultValue={group.name} required maxLength={120} /></label><DestinationChoices available={available} selected={group.memberAccountIds} /><div className="channel-form-actions"><button className="primary-button">Save group</button></div></form><form className="delete-group-form" action={deleteGroupAction.bind(null, brand.id, group.id)}><button className="tertiary-button" type="submit">Delete group</button><p>Deleting the group does not disconnect its accounts or affect prior approvals.</p></form></details>
            </article>;
          })}</div> : <div className="channels-empty"><strong>No account groups yet.</strong><p>One-off publishing stays unchanged. Groups are optional routing convenience only.</p></div>}
        </section>
      </main>
    </KairoProductShell>
  );
}

function GroupForm({ brandId, available }: { brandId: string; available: Awaited<ReturnType<typeof getChannelAccounts>> }) {
  return <form className="channel-form create-group-form" action={createGroupAction.bind(null, brandId)}><label>Group name<input name="name" required maxLength={120} placeholder="e.g. Product launch" /></label><DestinationChoices available={available} selected={[]} /><div className="channel-form-actions"><button className="primary-button" disabled={!available.length}>Create group</button><p>Groups select accounts only. They never store credentials or bypass destination-specific review.</p></div></form>;
}

function DestinationChoices({ available, selected }: { available: Awaited<ReturnType<typeof getChannelAccounts>>; selected: string[] }) {
  return <fieldset><legend>Destinations</legend><div className="destination-choice-list">{available.map((account) => <label className="destination-choice" key={account.id}><input type="checkbox" name="memberAccountIds" value={account.id} defaultChecked={selected.includes(account.id)} /><span><strong>{account.displayName}</strong><small>{label(account.channel)} · {account.accountRef}{account.status === "reconnect-required" ? " · reconnect required" : ""}</small></span></label>)}</div></fieldset>;
}

function label(value: string) { return value.replace(/([A-Z])/g, " $1").replaceAll("-", " ").replace(/^./, (character) => character.toUpperCase()); }
