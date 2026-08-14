import { AuthForm } from "./auth-form";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ mode?: string; error?: string }>;

export default async function SignInPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const creating = params.mode === "signup";

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="wordmark large"><span className="brandmark" aria-hidden="true" />Kairo</div>
        <p className="eyebrow">Secure pilot access</p>
        <h1>{creating ? "Create your Kairo account." : "Sign in to Kairo."}</h1>
        <p className="lede">Your identity is managed securely; Workspace and Brand permissions remain enforced by Kairo.</p>
        <AuthForm creating={creating} initialError={params.error} />
        <a className="text-link" href={creating ? "/sign-in" : "/sign-in?mode=signup"}>{creating ? "Already have an account? Sign in" : "New to Kairo? Create an account"}</a>
      </section>
    </main>
  );
}
