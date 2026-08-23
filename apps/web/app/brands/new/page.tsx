import Link from "next/link";
import { redirect } from "next/navigation";
import { createBrandAction } from "../../actions";
import { getSession } from "../../../src/lib/kairo-api";
import styles from "../../onboarding/onboarding.module.css";
import { KairoLogo } from "../../kairo-icons";
import { BrandOnboardingForm } from "../../onboarding/brand-onboarding-form";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ workspace?: string; error?: string }>;

export default async function NewBrandPage({ searchParams }: { searchParams: SearchParams }) {
  const [session, query] = await Promise.all([getSession(), searchParams]);
  if (!session) redirect("/auth/login?returnTo=/brands/new");
  if (!session.workspaces.length) redirect("/onboarding");

  const workspace = session.workspaces.find((item) => item.id === query.workspace) ?? session.workspaces[0]!;
  const action = createBrandAction.bind(null, workspace.id);

  return (
    <main className={styles.page}>
      <section className={`${styles.surface} ${styles.onboardingSurface}`} aria-labelledby="new-brand-title">
        <div className={styles.topline}>
          <div className="wordmark"><KairoLogo /></div>
          <span className={styles.quietStatus}>New Brand</span>
        </div>

        <header className={`${styles.header} ${styles.onboardingHeader}`}>
          <p className={styles.eyebrow}>{workspace.name}</p>
          <h1 id="new-brand-title">Tell Kairo about this Brand.</h1>
          <p>Paste one public link. Kairo will infer the Brand context and keep it isolated from your other Brands.</p>
        </header>

        <BrandOnboardingForm action={action} error={query.error} submitLabel="Build this Brand" />

        <div className={styles.referenceNote}>
          <strong>No channel connection required.</strong>
          <p>You can connect publishing channels from Home or Brand after setup.</p>
        </div>

        <Link className={styles.signOut} href="/">Cancel</Link>
      </section>
    </main>
  );
}
