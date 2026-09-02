import { getSettingsData } from "../../lib/api";
import { isSettingsTabId } from "../../lib/settings";
import { KairoShell } from "../kairo-shell";
import { SettingsClient } from "./settings-client";
import styles from "./settings-page-header.module.css";

type SearchParams = Promise<{ brand?: string; authError?: string; tab?: string }>;

export default async function SettingsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const data = await getSettingsData(params.brand);

  return <KairoShell
    active="Settings"
    authenticated={data.authenticated}
    brandId={data.brand?.id}
    brandName={data.brand?.name ?? data.account.displayName}
    workspaceClassName="settings-avatar-workspace"
    proTip="Keep account, publishing, and provider access current so Kairo can work reliably in the background."
    proTipAction="Review settings"
    proTipHref="#settings-content"
    statusLabel="Discovery ready"
  >
    {params.authError ? <p className="auth-error" role="alert">{params.authError}</p> : null}
    <div className={styles.settingsPage}>
      <header className={styles.pageHeader}>
        <h1>Settings</h1>
        <p>Manage your account, workspace, channels, AI providers, and team access.</p>
      </header>
      <div className={styles.client}>
        <SettingsClient
          data={data}
          initialTab={params.tab && isSettingsTabId(params.tab) ? params.tab : "account"}
          legacyWebUrl={process.env.NEXT_PUBLIC_KAIRO_WEB_URL ?? "https://kairo-two-plum.vercel.app"}
        />
      </div>
    </div>
  </KairoShell>;
}
