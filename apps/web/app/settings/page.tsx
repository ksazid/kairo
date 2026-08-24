import { redirect } from "next/navigation";
import { getBrands, getSession } from "../../src/lib/kairo-api";
import { KairoProductShell } from "../kairo-product-shell";
import { ThemeToggle } from "../theme-toggle";
import styles from "./settings.module.css";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login?returnTo=/settings");

  const workspace = session.workspaces[0];
  if (!workspace) redirect("/onboarding");
  const brands = await getBrands(workspace.id).catch(() => []);
  const brand = brands[0] ?? null;

  return (
    <KairoProductShell brandId={brand?.id} workspaceId={workspace.id} pageLabel="Settings">
      <main id="kairo-main-content" tabIndex={-1} className={`${styles.settings} workspace-main`}>
        <header className={styles.header}>
          <p className="eyebrow">Profile</p>
          <h1>Settings</h1>
          <p>Keep account-level preferences simple. Brand-specific context and channel connections stay with the Brand.</p>
        </header>

        <section className={styles.section} aria-labelledby="appearance-settings-title">
          <div>
            <h2 id="appearance-settings-title">Appearance</h2>
            <p>Choose the interface appearance used on this device.</p>
          </div>
          <div>
            <div className={styles.control}>
              <div>
                <strong>Light or dark</strong>
                <span>Your choice is stored locally in this browser.</span>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="account-settings-title">
          <div>
            <h2 id="account-settings-title">Account</h2>
            <p>Account access and current Workspace context.</p>
          </div>
          <div>
            <div className={styles.control}>
              <div>
                <strong>{workspace.name}</strong>
                <span>Current Workspace</span>
              </div>
            </div>
            <div className={styles.control}>
              <div>
                <strong>Sign out</strong>
                <span>End this Kairo session on this device.</span>
              </div>
              <a className={styles.accountAction} href="/auth/logout">Sign out</a>
            </div>
          </div>
        </section>
      </main>
    </KairoProductShell>
  );
}
