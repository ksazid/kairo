import Link from "next/link";
import { getBrand, getChannelAccounts } from "../../../../../src/lib/kairo-api";
import { getChannelAccountGroups } from "../../../../../src/lib/channel-account-groups-api";
import { PilotMobileNav } from "../../../../pilot-mobile-nav";
import { KairoSidebar } from "../../ideas/page";
import { createGroupAction, deleteGroupAction, updateGroupAction } from "./actions";

type Params = Promise<{ brandId: string }>;
type Search = Promise<{ notice?: string; error?: string }>;

export default async function AccountGroupsPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { brandId } = await params;
  const [brand, accounts, groups, messages] = await Promise.all([getBrand(brandId), getChannelAccounts(brandId), getChannelAccountGroups(brandId), searchParams]);
  if (!brand) return null;
  const available = accounts.filter((account) => account.status !== "disabled");
  return <div className="app-shell">
    <KairoSidebar brandId={brand.id} active="Content Studio" />
    <main className="workspace-main studio-main">
      <Link className="back-link" href={`/brands/${encodeURIComponent(brand.id)}/campaigns`}>← Content Studio</Link>
      <header className="studio-header"><div><p className="eyebrow">Channels</p><h1>Account groups</h1><p>Save reusable destination sets without granting them publishing authority. Every member still receives its own approval and publish command.</p></div><span className="idea-status">Human controlled</span></header>
      {messages.notice ? <p className="notice success" role="status">{messages.notice}</p> : null}{messages.error ? <p className="notice error" role="alert">{messages.error}</p> : null}

      <section className="review-panel" aria-labelledby="new-group-title">
        <div className="review-heading"><div><p className="eyebrow">Reusable destinations</p><h2 id="new-group-title">Create an account group</h2></div><span className="review-status draft">{available.length} available</span></div>
        <form className="approval-form" action={createGroupAction.bind(null, brand.id)}>
          <label>Group name<input name="name" required maxLength={120} placeholder="e.g. Product launch" /></label>
          <fieldset><legend>Destinations</legend><div className="finding-list">{available.map((account) => <label key={account.id}><input type="checkbox" name="memberAccountIds" value={account.id} /> <strong>{account.displayName}</strong> · {account.channel} · {account.accountRef}{account.status === "reconnect-required" ? " · reconnect required" : ""}</label>)}</div></fieldset>
          <button className="primary-button" disabled={!available.length}>Create group</button>
          <p>Groups select accounts only. They never store credentials and never bypass destination-specific review or approval.</p>
        </form>
      </section>

      <div className="studio-assets">{groups.length ? groups.map((group) => <section className="review-panel" key={group.id} aria-labelledby={`group-${group.id}`}>
        <div className="review-heading"><div><p className="eyebrow">Account group</p><h2 id={`group-${group.id}`}>{group.name}</h2></div><span className="review-status approved">{group.memberAccountIds.length} destination{group.memberAccountIds.length === 1 ? "" : "s"}</span></div>
        <form className="approval-form" action={updateGroupAction.bind(null, brand.id, group.id)}>
          <label>Group name<input name="name" defaultValue={group.name} required maxLength={120} /></label>
          <fieldset><legend>Destinations</legend><div className="finding-list">{available.map((account) => <label key={account.id}><input type="checkbox" name="memberAccountIds" value={account.id} defaultChecked={group.memberAccountIds.includes(account.id)} /> <strong>{account.displayName}</strong> · {account.channel} · {account.accountRef}{account.status === "reconnect-required" ? " · reconnect required" : ""}</label>)}</div></fieldset>
          <button className="secondary-button">Save group</button>
        </form>
        <form action={deleteGroupAction.bind(null, brand.id, group.id)}><button className="secondary-button" type="submit">Delete group</button></form>
      </section>) : <section className="studio-empty"><div><p className="eyebrow">No groups yet</p><h2>Keep one-off publishing unchanged.</h2><p>Create a group only when the same connected accounts are selected repeatedly.</p></div></section>}</div>
    </main>
    <PilotMobileNav brandId={brand.id} active="More" />
  </div>;
}
