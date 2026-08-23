import { redirect } from "next/navigation";
import { getBrand, getBrandBrain, getSession } from "../../../../../src/lib/kairo-api";
import { KairoLogo } from "../../../../kairo-icons";
import styles from "../../../../onboarding/onboarding.module.css";
import confirmStyles from "./confirm.module.css";
import { confirmOnboardingBrandAction } from "../actions";

export const dynamic = "force-dynamic";

type Params = Promise<{ brandId: string }>;
type SearchParams = Promise<{ notice?: string }>;

export default async function ConfirmBrandPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const session = await getSession();
  if (!session) redirect("/auth/login?returnTo=/");

  const [{ brandId }, query] = await Promise.all([params, searchParams]);
  const [brand, brain] = await Promise.all([getBrand(brandId), getBrandBrain(brandId).catch(() => [])]);
  if (!brand) redirect("/");
  const workspace = session.workspaces.find((item) => item.id === brand.workspaceId);
  if (!workspace) redirect("/");

  const values = new Map(brain.map((field) => [field.fieldKey, field.value]));
  const summaries = [
    ["What you do", first(values, "identity.description", "positioning.value-proposition")],
    ["Who you serve", first(values, "audience.primary")],
    ["Your style", first(values, "voice.tone", "content.visual-direction")],
    ["Main topics", first(values, "content.pillars", "content.preferred-topics")],
  ].filter((item): item is [string, string] => Boolean(item[1]));

  const action = confirmOnboardingBrandAction.bind(null, brand.id);
  const limited = query.notice === "learning-limited" || summaries.length === 0;

  return (
    <main className={styles.page}>
      <section className={`${styles.surface} ${styles.onboardingSurface}`} aria-labelledby="brand-confirm-title">
        <div className={styles.topline}>
          <div className="wordmark"><KairoLogo /></div>
          <span className={styles.quietStatus}>Brand learned</span>
        </div>

        <header className={`${styles.header} ${styles.onboardingHeader}`}>
          <p className={styles.eyebrow}>{brand.name}</p>
          <h1 id="brand-confirm-title">{limited ? "Your Brand is ready to start." : "Here’s how Kairo understands your Brand."}</h1>
          <p>{limited ? "Kairo saved your public reference. You can refine what it knows later from Brand." : "A quick check is enough. Kairo keeps learning as you create and measure content."}</p>
        </header>

        {summaries.length ? (
          <div className={confirmStyles.summary} aria-label="Kairo Brand understanding">
            {summaries.map(([label, value]) => (
              <div className={confirmStyles.row} key={label}>
                <span>{label}</span>
                <p>{value}</p>
              </div>
            ))}
          </div>
        ) : null}

        <form action={action} className={confirmStyles.confirmForm}>
          <button className={`${styles.primaryAction} primary-button`} type="submit">
            <span>{summaries.length ? "Looks right" : "Continue to Home"}</span>
            <span className={styles.buttonArrow} aria-hidden="true">→</span>
          </button>
        </form>

        <p className={confirmStyles.footnote}>Goals and technical setup stay under the hood. You can edit Brand details later.</p>
      </section>
    </main>
  );
}

function first(values: Map<string, string>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = values.get(key)?.trim();
    if (value) return value;
  }
  return undefined;
}
