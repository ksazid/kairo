import styles from "./sign-in.module.css";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ mode?: string; error?: string; returnTo?: string }>;

function safeReturnTo(value: string | undefined) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : undefined;
}

function loginHref(params: { creating: boolean; google?: boolean; returnTo?: string }) {
  const query = new URLSearchParams();
  if (params.creating) query.set("screen_hint", "signup");
  if (params.google) query.set("connection", "google-oauth2");
  const returnTo = safeReturnTo(params.returnTo);
  if (returnTo) query.set("returnTo", returnTo);
  return `/auth/login${query.size ? `?${query.toString()}` : ""}`;
}

function GoogleMark() {
  return (
    <svg className={styles.providerIcon} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M21.35 12.2c0-.64-.06-1.25-.17-1.84H12v3.48h5.25a4.49 4.49 0 0 1-1.95 2.94v2.26h3.16c1.85-1.7 2.89-4.21 2.89-6.84Z" />
      <path fill="#34A853" d="M12 21.72c2.64 0 4.85-.87 6.46-2.37l-3.16-2.26c-.87.58-1.99.93-3.3.93-2.55 0-4.7-1.72-5.48-4.03H3.26v2.34A9.75 9.75 0 0 0 12 21.72Z" />
      <path fill="#FBBC05" d="M6.52 13.99A5.86 5.86 0 0 1 6.22 12c0-.69.12-1.36.3-1.99V7.67H3.26A9.72 9.72 0 0 0 2.22 12c0 1.56.37 3.04 1.04 4.33l3.26-2.34Z" />
      <path fill="#EA4335" d="M12 5.98c1.44 0 2.73.5 3.75 1.46l2.81-2.81A9.41 9.41 0 0 0 12 2.28a9.75 9.75 0 0 0-8.74 5.39l3.26 2.34C7.3 7.7 9.45 5.98 12 5.98Z" />
    </svg>
  );
}

export default async function SignInPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const creating = params.mode === "signup";
  const returnTo = safeReturnTo(params.returnTo);

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="auth-title">
        <header className={styles.header}>
          <div className="wordmark large"><span className="brandmark" aria-hidden="true" />Kairo</div>
          <p className={styles.eyebrow}>Secure pilot access</p>
          <h1 id="auth-title">{creating ? "Create your Kairo account" : "Welcome back"}</h1>
          <p className={styles.lede}>
            {creating
              ? "Start with your email. Auth0 securely handles your password on the next step."
              : "Sign in to access your workspace, Brand Brain and publishing tools."}
          </p>
        </header>

        {params.error ? <p className={`notice error ${styles.notice}`} role="alert">{params.error}</p> : null}

        <form className={styles.form} action="/auth/login" method="get">
          {creating ? <input type="hidden" name="screen_hint" value="signup" /> : null}
          {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}

          <label className={styles.field}>
            <span>Email address</span>
            <input
              className={styles.input}
              type="email"
              name="login_hint"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              maxLength={320}
              required
              autoFocus
            />
          </label>

          <button className={styles.primaryButton} type="submit">
            {creating ? "Continue to create account" : "Continue with email"}
          </button>
          <p className={styles.passwordNote}>Password entry happens securely on Auth0 after you continue.</p>
        </form>

        <div className={styles.divider} aria-hidden="true"><span>or</span></div>

        <a className={styles.googleButton} href={loginHref({ creating, google: true, returnTo })}>
          <GoogleMark />
          <span>{creating ? "Sign up with Google" : "Continue with Google"}</span>
        </a>

        <p className={styles.switchMode}>
          {creating ? "Already have an account?" : "New to Kairo?"}{" "}
          <a href={creating ? "/sign-in" : "/sign-in?mode=signup"}>
            {creating ? "Sign in" : "Create an account"}
          </a>
        </p>

        <footer className={styles.securityNote}>
          <span className={styles.securityDot} aria-hidden="true" />
          <p><strong>Your password stays with the identity provider.</strong> Kairo receives only the verified identity and keeps Workspace and Brand permissions under Kairo control.</p>
        </footer>
      </section>
    </main>
  );
}
