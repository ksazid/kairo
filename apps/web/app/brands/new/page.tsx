import Link from "next/link";
import { redirect } from "next/navigation";
import { createBrandAction } from "../../actions";
import { getSession } from "../../../src/lib/kairo-api";
import styles from "../../onboarding/onboarding.module.css";
import { BrandSourceOptions } from "../../source-options";
import { KairoLogo } from "../../kairo-icons";

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
      <section className={styles.surface} aria-labelledby="new-brand-title">
        <div className={styles.topline}>
          <div className="wordmark"><KairoLogo /></div>
          <span className={styles.step}>New Brand</span>
        </div>

        <header className={styles.header}>
          <p className={styles.eyebrow}>Workspace · {workspace.name}</p>
          <h1 id="new-brand-title">Add another Brand.</h1>
          <p>Each Brand keeps its own Brand Brain, Ideas, Research, Campaigns and publishing context.</p>
        </header>

        {query.error ? <p className="notice error" role="alert">{query.error}</p> : null}

        <form action={action} className={styles.form}>
          <label>
            <span>Brand name</span>
            <input name="brandName" required maxLength={120} placeholder="My next Brand" autoComplete="off" />
          </label>
          <label>
            <span>Paste your website <em>optional</em></span>
            <input name="websiteUrl" type="url" placeholder="https://yourbrand.com" inputMode="url" />
            <small>Kairo will use readable public pages as evidence, never automatic Brand truth.</small>
          </label>
          <BrandSourceOptions />
          <button className="primary-button" type="submit">Create Brand and continue</button>
        </form>

        <Link className={styles.signOut} href="/">Cancel</Link>
      </section>
    </main>
  );
}
