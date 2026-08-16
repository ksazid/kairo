import styles from "./sign-in.module.css";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ error?: string; returnTo?: string }>;

function safeReturnTo(value: string | undefined) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export default async function SignInRecoveryPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const returnTo = safeReturnTo(params.returnTo);
  const retry = `/auth/login?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="auth-title">
        <header className={styles.header}>
          <div className="wordmark large"><span className="brandmark" aria-hidden="true" />Kairo</div>
          <p className={styles.eyebrow}>Secure access</p>
          <h1 id="auth-title">Continue to Kairo</h1>
          <p className={styles.lede}>Authentication is handled by Kairo&apos;s Auth0 Universal Login. Your password is never entered into or processed by the Kairo application.</p>
        </header>

        {params.error ? <p className={`notice error ${styles.notice}`} role="alert">{params.error}</p> : null}

        <div className={styles.form}>
          <a className={styles.primaryButton} href={retry}>Try sign in again</a>
        </div>

        <footer className={styles.securityNote}>
          <span className={styles.securityDot} aria-hidden="true" />
          <p><strong>Your password stays with the identity provider.</strong> Kairo receives only the verified identity and keeps Workspace and Brand permissions under Kairo control.</p>
        </footer>
      </section>
    </main>
  );
}
