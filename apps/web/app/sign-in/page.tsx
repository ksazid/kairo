import { redirect } from "next/navigation";
import { signInKairo, signUpKairo } from "../session-actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ mode?: string; error?: string }>;

export default async function SignInPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const creating = params.mode === "signup";

  async function submit(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const mode = String(formData.get("mode") ?? "signin");
    const name = String(formData.get("name") ?? "").trim();
    if (!email || !password || (mode === "signup" && !name)) {
      redirect(`/sign-in?mode=${mode === "signup" ? "signup" : "signin"}&error=Missing%20required%20fields`);
    }
    const error = mode === "signup"
      ? await signUpKairo(name, email, password)
      : await signInKairo(email, password);
    if (error) redirect(`/sign-in?mode=${mode === "signup" ? "signup" : "signin"}&error=${encodeURIComponent(error)}`);
    redirect("/");
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="wordmark large"><span className="brandmark" aria-hidden="true" />Kairo</div>
        <p className="eyebrow">Secure pilot access</p>
        <h1>{creating ? "Create your Kairo account." : "Sign in to Kairo."}</h1>
        <p className="lede">Your identity is managed securely; Workspace and Brand permissions remain enforced by Kairo.</p>
        {params.error ? <p className="notice error" role="alert">{params.error}</p> : null}
        <form action={submit} className="onboarding-form">
          <input type="hidden" name="mode" value={creating ? "signup" : "signin"} />
          {creating ? <label>Name<input name="name" required maxLength={120} autoComplete="name" /></label> : null}
          <label>Email<input name="email" type="email" required autoComplete="email" /></label>
          <label>Password<input name="password" type="password" required minLength={8} autoComplete={creating ? "new-password" : "current-password"} /></label>
          <button className="primary-button" type="submit">{creating ? "Create account" : "Sign in"}</button>
        </form>
        <a className="text-link" href={creating ? "/sign-in" : "/sign-in?mode=signup"}>{creating ? "Already have an account? Sign in" : "New to Kairo? Create an account"}</a>
      </section>
    </main>
  );
}
