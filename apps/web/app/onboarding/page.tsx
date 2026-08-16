import { redirect } from "next/navigation";
import { createWorkspaceAction } from "../actions";
import { getSession } from "../../src/lib/kairo-api";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login?returnTo=/onboarding");
  if (session.workspaces.length > 0) redirect("/");

  const displayName = session.account.displayName ?? session.account.email ?? "there";

  return (
    <main className="onboarding-page">
      <section className="onboarding-card" aria-labelledby="onboarding-title">
        <div className="wordmark"><span className="brandmark" aria-hidden="true" />Kairo</div>
        <p className="eyebrow">Welcome, {displayName}</p>
        <h1 id="onboarding-title">Give Kairo your Brand.</h1>
        <p className="lede">Start with the essentials. Kairo will help build the Brand Brain next instead of asking you to write a strategy document.</p>
        <form action={createWorkspaceAction} className="onboarding-form">
          <label>Workspace name<input name="workspaceName" required maxLength={120} placeholder="My Studio" autoComplete="organization" /></label>
          <label>Brand name<input name="brandName" required maxLength={120} placeholder="The Duke 390" /></label>
          <label>Website or social profile <span>optional</span><input name="publicReferenceUrl" type="url" placeholder="https://instagram.com/yourbrand" inputMode="url" /></label>
          <button className="primary-button" type="submit">Continue to Brand Brain</button>
        </form>
        <p className="fine-print">You will choose the Brand&apos;s primary goal next. Everything Kairo infers remains reviewable.</p>
        <a className="text-link" href="/auth/logout">Sign out</a>
      </section>
    </main>
  );
}
