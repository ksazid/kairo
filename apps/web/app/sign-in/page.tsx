import styles from "./sign-in.module.css";
import { safeAppReturnTo, signInRecoveryView } from "../../src/lib/first-run-view-model";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ error?: string; returnTo?: string }>;

export default async function SignInRecoveryPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const returnTo = safeAppReturnTo(params.returnTo);
  const view = signInRecoveryView(params.error);
  const retry = `/auth/login?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <main className={styles.page}>
      <section className={styles.surface} aria-labelledby="auth-title">
        <div className={styles.wordmarkRow}>
          <div className="wordmark"><span className="brandmark" aria-hidden="true" />Kairo</div>
          <span className={styles.context}>Secure access</span>
        </div>

        <div className={styles.content}>
          <p className={styles.eyebrow}>{view.eyebrow}</p>
          <h1 id="auth-title">{view.title}</h1>
          <p className={styles.lede}>{view.description}</p>

          {view.errorMessage ? <p className={`notice error ${styles.notice}`} role="alert">{view.errorMessage}</p> : null}

          <a className={styles.primaryButton} href={retry}>{view.actionLabel}</a>
          <p className={styles.providerNote}>You&apos;ll continue in Kairo&apos;s secure identity-provider window, then return here automatically.</p>
        </div>

        <footer className={styles.securityNote}>
          <span className={styles.securityDot} aria-hidden="true" />
          <p><strong>Kairo never receives your password.</strong> The identity provider verifies you; Kairo keeps Workspace and Brand permissions inside Kairo.</p>
        </footer>
      </section>
    </main>
  );
}
