import { redirect } from "next/navigation";
import { createWorkspaceAction } from "../actions";
import { getSession } from "../../src/lib/kairo-api";
import styles from "./onboarding.module.css";
import { BrandSourceOptions } from "../source-options";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login?returnTo=/onboarding");
  if (session.workspaces.length > 0) redirect("/");

  const displayName = session.account.displayName ?? session.account.email ?? "there";

  return (
    <main className={styles.page}>
      <section className={styles.surface} aria-labelledby="onboarding-title">
        <div className={styles.topline}>
          <div className="wordmark"><span className="brandmark" aria-hidden="true" />Kairo</div>
          <span className={styles.step}>Step 1 of 2</span>
        </div>

        <header className={styles.header}>
          <p className={styles.eyebrow}>Welcome, {displayName}</p>
          <h1 id="onboarding-title">Add your first Brand.</h1>
          <p>Keep this lightweight. Give Kairo the basics now; next, Kairo will propose Brand Brain suggestions for you to review.</p>
        </header>

        <form action={createWorkspaceAction} className={styles.form}>
          <label>
            <span>Workspace name</span>
            <input name="workspaceName" required maxLength={120} placeholder="My Studio" autoComplete="organization" />
            <small>The private home for your Brands.</small>
          </label>
          <label>
            <span>Brand name</span>
            <input name="brandName" required maxLength={120} placeholder="The Duke 390" autoComplete="off" />
          </label>
          <label>
            <span>Paste your website <em>optional</em></span>
            <input name="websiteUrl" type="url" placeholder="https://yourbrand.com" inputMode="url" aria-describedby="brand-reference-help" />
            <small id="brand-reference-help">Kairo will use readable public pages as evidence for Brand Brain suggestions.</small>
          </label>

          <BrandSourceOptions />

          <button className="primary-button" type="submit">Create Brand and continue</button>
        </form>

        <div className={styles.nextStep} aria-label="What happens next">
          <span>2</span>
          <div><strong>Review Kairo&apos;s suggestions</strong><p>Positioning, audience, voice and content strategy stay suggestions until you confirm them.</p></div>
        </div>

        <a className={styles.signOut} href="/auth/logout">Sign out</a>
      </section>
    </main>
  );
}
