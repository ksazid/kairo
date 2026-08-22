import { SkeletonGroup } from "../../../ui-states";

export default function Loading(){return <main className="workspace-main campaigns-main" aria-busy="true"><p className="eyebrow">Campaigns</p><h1>Loading Campaigns…</h1><p className="lede">Restoring Brand-scoped lineage and draft work.</p><SkeletonGroup rows={4} label="Loading Campaigns" /></main>}
