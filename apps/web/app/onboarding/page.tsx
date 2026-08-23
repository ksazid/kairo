import { redirect } from "next/navigation";
import { createWorkspaceAction } from "../actions";
import { getSession } from "../../src/lib/kairo-api";
import styles from "./onboarding.module.css";
import { KairoLogo } from "../kairo-icons";
import { BrandOnboardingForm } from "./brand-onboarding-form";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ error?: string }>;

export default async function OnboardingPage({ searchParams }: { searchParams: SearchParams }) {
  const [session, query] = await Promise.all([getSession(), searchParams]);
  if (!session) redirect("/auth/login?returnTo=/onboarding");
  if (session.workspaces.length > 0) redirect("/");

  const displayName = session.account.displayName ?? session.account.email;

  return (
    <main className={styles.page}>
      <section className={`${styles.surface} ${styles.onboardingSurface}`} aria-labelledby="onboarding-title">
        <div className={styles.topline}>
          <div className="wordmark"><KairoLogo /></div>
          <span className={styles.quietStatus}>Brand setup</span>
        </div>

        <header className={`${styles.header} ${styles.onboardingHeader}`}>
          {displayName ? <p className={styles.eyebrow}>Welcome, {displayName}</p> : null}
          <h1 id="onboarding-title">Tell Kairo about your Brand.</h1>
          <p>Give Kairo one public link. It will learn the useful context and prepare a starting point for you.</p>
        </header>

        <BrandOnboardingForm action={createWorkspaceAction} error={query.error} />

        <div className={styles.referenceNote}>
          <strong>One link is enough to start.</strong>
          <p>Connecting publishing channels happens later, only when you need it.</p>
        </div>

        <a className={styles.signOut} href="/auth/logout">Sign out</a>
      </section>
    </main>
  );
}
