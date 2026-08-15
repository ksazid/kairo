export const dynamic = "force-dynamic";

type SearchParams = Promise<{ mode?: string; error?: string; returnTo?: string }>;

function loginHref(params: { creating: boolean; google?: boolean; returnTo?: string }) {
  const query = new URLSearchParams();
  if (params.creating) query.set("screen_hint", "signup");
  if (params.google) query.set("connection", "google-oauth2");
  if (params.returnTo?.startsWith("/") && !params.returnTo.startsWith("//")) query.set("returnTo", params.returnTo);
  return `/auth/login${query.size ? `?${query.toString()}` : ""}`;
}

export default async function SignInPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const creating = params.mode === "signup";

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="wordmark large"><span className="brandmark" aria-hidden="true" />Kairo</div>
        <p className="eyebrow">Secure pilot access</p>
        <h1>{creating ? "Create your Kairo account." : "Sign in to Kairo."}</h1>
        <p className="lede">Authentication is handled by our identity provider. Workspace and Brand permissions remain enforced by Kairo.</p>
        {params.error ? <p className="notice error" role="alert">{params.error}</p> : null}

        <div className="onboarding-form">
          <a className="secondary-button" href={loginHref({ creating, google: true, returnTo: params.returnTo })}>
            <span aria-hidden="true" style={{ fontWeight: 800 }}>G</span>
            Continue with Google
          </a>
          <a className="primary-button" href={loginHref({ creating, returnTo: params.returnTo })}>
            {creating ? "Create account securely" : "Continue to sign in"}
          </a>
        </div>

        <p className="fine-print">Kairo never receives or stores your password. Credential entry happens on the identity provider&apos;s hosted login page.</p>
        <a className="text-link" href={creating ? "/sign-in" : "/sign-in?mode=signup"}>{creating ? "Already have an account? Sign in" : "New to Kairo? Create an account"}</a>
      </section>
    </main>
  );
}
