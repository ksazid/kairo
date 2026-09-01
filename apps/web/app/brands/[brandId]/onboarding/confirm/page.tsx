import { redirect } from "next/navigation";
import { getBrand, getBrandBrain, getSession } from "../../../../../src/lib/kairo-api";
import { getBrandBrainActivation, type BrandBrainActivationView } from "../../../../../src/lib/brand-brain-activation-api";
import { KairoLogo } from "../../../../kairo-icons";
import styles from "../../../../onboarding/onboarding.module.css";
import confirmStyles from "./confirm.module.css";
import { confirmOnboardingBrandAction, enrichOnboardingBrandAction } from "../actions";

export const dynamic = "force-dynamic";

type Params = Promise<{ brandId: string }>;
type SearchParams = Promise<{ notice?: string; error?: string }>;

type Enrichment =
  | { kind: "source"; prompt: string }
  | { kind: "field"; fieldKey: string; prompt: string }
  | { kind: "none"; prompt: string };

export default async function ConfirmBrandPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const session = await getSession();
  if (!session) redirect("/auth/login?returnTo=/");

  const [{ brandId }, query] = await Promise.all([params, searchParams]);
  const [brand, brain, activation] = await Promise.all([
    getBrand(brandId),
    getBrandBrain(brandId).catch(() => []),
    getBrandBrainActivation(brandId).catch(() => undefined),
  ]);
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

  const readiness = activation?.readiness;
  const enrichment = nextEnrichment(activation);
  const action = confirmOnboardingBrandAction.bind(null, brand.id);
  const limited = query.notice === "learning-limited" || summaries.length === 0;
  const statusText = activation?.hunterReady
    ? "Ready for Hunter"
    : activation?.status === "needs-review"
      ? "Needs confirmation"
      : "Needs one more useful signal";

  return (
    <main className={styles.page}>
      <section className={`${styles.surface} ${styles.onboardingSurface}`} aria-labelledby="brand-confirm-title">
        <div className={styles.topline}>
          <div className="wordmark"><KairoLogo /></div>
          <span className={styles.quietStatus}>Brand learned</span>
        </div>

        <header className={`${styles.header} ${styles.onboardingHeader}`}>
          <p className={styles.eyebrow}>{brand.name}</p>
          <h1 id="brand-confirm-title">{limited ? "Your Brand is ready to review." : "Here’s how Kairo understands your Brand."}</h1>
          <p>{limited ? "Kairo saved your public reference. Confirm any important gaps before Discovery starts." : "A quick check is enough. Confirmed Brand facts stay authoritative as Kairo learns."}</p>
        </header>

        {query.error ? <p role="alert">{query.error}</p> : null}

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

        {readiness ? <section className={confirmStyles.intelligenceCard} aria-label="Brand Intelligence readiness"><div className={confirmStyles.scoreRow}><div><strong>Brand Intelligence</strong><span>{statusText}</span></div><b>{readiness.brandIntelligenceScore}%</b></div><div className={confirmStyles.meter} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={readiness.brandIntelligenceScore}><span className={confirmStyles.meterFill} style={{ width: `${readiness.brandIntelligenceScore}%` }} /></div><div className={confirmStyles.scoreMeta}><span>Evidence {readiness.evidenceCoverage}%</span><span>Confidence {readiness.confidence}%</span></div></section> : null}
        {activation?.hunterReady ? <p className={confirmStyles.readiness} role="status">✓ Brand Brain ready for Discovery</p> : enrichment ? <div className={confirmStyles.readinessNotice} role="status"><strong>{activation?.status === "needs-review" ? "Confirm one important detail before Discovery." : "Kairo needs one more useful signal before Discovery."}</strong><p>{enrichment.prompt}</p><form action={enrichOnboardingBrandAction.bind(null, brand.id)} className={confirmStyles.enrichmentForm}>{enrichment.kind === "source" ? <><input type="hidden" name="kind" value="source" /><input name="publicReferenceUrl" type="url" required placeholder="https://yourbrand.com" aria-label="Public Brand link" /><button className="secondary-button" type="submit">Add source</button></> : enrichment.kind === "none" ? <><input type="hidden" name="kind" value="none" /><button className="secondary-button" type="submit">Confirm none</button></> : <><input type="hidden" name="kind" value="field" /><input type="hidden" name="fieldKey" value={enrichment.fieldKey} /><input name="value" required placeholder="Type your answer" aria-label={enrichment.prompt} /><button className="secondary-button" type="submit">Save answer</button></>}</form></div> : null}

        <form action={action} className={confirmStyles.confirmForm}>
          <button className={`${styles.primaryAction} primary-button`} type="submit" disabled={!activation?.hunterReady}>
            <span>{activation?.hunterReady ? "Looks right · Continue" : "Continue"}</span>
            <span className={styles.buttonArrow} aria-hidden="true">→</span>
          </button>
        </form>

        <p className={confirmStyles.footnote}>Onboarding stops at Ready for Hunter. Discovery run history and Learning appear only after those lifecycle steps actually run.</p>
      </section>
    </main>
  );
}

function nextEnrichment(activation?: BrandBrainActivationView): Enrichment | undefined {
  const next = activation?.readiness.nextAction;
  if (next?.type === "add-source") return { kind: "source", prompt: next.prompt };
  if (next?.type === "confirm-none") return { kind: "none", prompt: next.prompt };
  if (next?.type === "confirm-field") return { kind: "field", fieldKey: next.fieldKey, prompt: next.prompt };

  const recommendation = activation?.recommendedSources[0];
  if (!recommendation) return undefined;
  if (recommendation.type === "website" || recommendation.type === "public-link") {
    return { kind: "source", prompt: recommendation.reason };
  }
  if (recommendation.fieldKey) {
    return { kind: "field", fieldKey: recommendation.fieldKey, prompt: recommendation.reason };
  }
  return undefined;
}

function first(values: Map<string, string>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = values.get(key)?.trim();
    if (value) return value;
  }
  return undefined;
}
