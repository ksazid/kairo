import { redirect } from "next/navigation";
import { getBrand, getBrandBrain, getBrandDnaReadiness, getSession } from "../../../../../src/lib/kairo-api";
import { KairoLogo } from "../../../../kairo-icons";
import styles from "../../../../onboarding/onboarding.module.css";
import confirmStyles from "./confirm.module.css";
import { confirmOnboardingBrandAction, enrichOnboardingBrandAction } from "../actions";

export const dynamic = "force-dynamic";

type Params = Promise<{ brandId: string }>;
type SearchParams = Promise<{ notice?: string }>;

export default async function ConfirmBrandPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const session = await getSession();
  if (!session) redirect("/auth/login?returnTo=/");

  const [{ brandId }, query] = await Promise.all([params, searchParams]);
  const [brand, brain, readiness] = await Promise.all([getBrand(brandId), getBrandBrain(brandId).catch(() => []), getBrandDnaReadiness(brandId).catch(() => undefined)]);
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

        {readiness ? <section className={confirmStyles.intelligenceCard} aria-label="Brand Intelligence readiness"><div className={confirmStyles.scoreRow}><div><strong>Brand Intelligence</strong><span>{readiness.status === "ready" ? "Ready for Hunter" : "Needs one more useful signal"}</span></div><b>{readiness.brandIntelligenceScore}%</b></div><div className={confirmStyles.meter} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={readiness.brandIntelligenceScore}><span className={confirmStyles.meterFill} style={{ width: `${readiness.brandIntelligenceScore}%` }} /></div><div className={confirmStyles.scoreMeta}><span>Evidence {readiness.evidenceCoverage}%</span><span>Confirmed {readiness.confidence}%</span></div></section> : null}
        {readiness?.status === "ready" ? <p className={confirmStyles.readiness} role="status">✓ Brand DNA ready</p> : readiness?.nextAction ? <div className={confirmStyles.readinessNotice} role="status"><strong>Kairo needs one more thing before it can find relevant opportunities.</strong><p>{readiness.nextAction.prompt}</p><form action={enrichOnboardingBrandAction.bind(null, brand.id)} className={confirmStyles.enrichmentForm}>{readiness.nextAction.type === "add-source" ? <><input type="hidden" name="kind" value="source" /><input name="publicReferenceUrl" type="url" required placeholder="https://yourbrand.com" aria-label="Public Brand link" /><button className="secondary-button" type="submit">Add source</button></> : readiness.nextAction.type === "confirm-none" ? <><input type="hidden" name="kind" value="none" /><button className="secondary-button" type="submit">Confirm none</button></> : <><input type="hidden" name="kind" value="field" /><input type="hidden" name="fieldKey" value={readiness.nextAction.fieldKey} /><input name="value" required placeholder="Type your answer" aria-label={readiness.nextAction.prompt} /><button className="secondary-button" type="submit">Save answer</button></>}</form></div> : null}

        <form action={action} className={confirmStyles.confirmForm}>
          <button className={`${styles.primaryAction} primary-button`} type="submit" disabled={readiness?.status !== "ready"}>
            <span>{readiness?.status === "ready" ? "Looks right · Continue" : "Continue"}</span>
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
