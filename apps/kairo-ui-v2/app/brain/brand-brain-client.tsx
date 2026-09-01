"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CircleAlert, Database, Edit3, ExternalLink, Plus, ShieldCheck, Sparkles, X } from "lucide-react";
import type { BrandBrainPageViewModel, EditableBrainField } from "../../lib/brand-brain-view-model";
import styles from "./brand-brain.module.css";

type EditTarget = {
  fieldKey: string;
  label: string;
  value: string;
  section: string;
  version?: number;
};

export function BrandBrainClient({ model, brandId }: { model: BrandBrainPageViewModel; brandId?: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState<EditTarget | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function saveField() {
    if (!brandId || !editing?.value.trim()) return;
    setBusy(true);
    setError("");
    try {
      await mutate({ action: "edit-field", brandId, fieldKey: editing.fieldKey, section: editing.section, value: editing.value, ...(editing.version ? { expectedVersion: editing.version } : {}) });
      setEditing(null);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Kairo could not save this field.");
    } finally {
      setBusy(false);
    }
  }

  async function addSource() {
    if (!brandId || !sourceUrl.trim()) return;
    setBusy(true);
    setError("");
    try {
      await mutate({ action: "add-source", brandId, url: sourceUrl });
      setSourceUrl("");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Kairo could not add this source.");
    } finally {
      setBusy(false);
    }
  }

  return <div className={styles.root}>
    <header className={styles.header}>
      <div>
        <span className={styles.eyebrow}><Sparkles aria-hidden="true"/>Brand intelligence</span>
        <h1>Brand Brain</h1>
        <p>The context Kairo uses to understand your Brand and decide what Hunter should look for.</p>
      </div>
      <span className={`${styles.hunterStatus} ${styles[model.activation.status]}`}>
        {model.activation.hunterReady ? <ShieldCheck aria-hidden="true"/> : <CircleAlert aria-hidden="true"/>}
        {model.activation.label}
      </span>
    </header>

    <section className={styles.metrics} aria-label="Brand Brain status">
      <Metric label="Brand Intelligence" value={model.intelligence.score === null ? "—" : `${model.intelligence.score}%`} detail={model.intelligence.status}/>
      <Metric label="Completeness" value={`${model.activation.completenessScore}%`} detail={`${model.activation.knownGroups}/${model.activation.totalGroups} core groups`}/>
      <Metric label="Evidence" value={`${model.activation.sourceCount}`} detail={`${model.activation.evidenceCoverage}% coverage`}/>
      <Metric label="Confirmed" value={`${model.activation.confidence}%`} detail="Owner-confirmed context"/>
    </section>

    {error ? <div className={styles.error} role="alert"><CircleAlert aria-hidden="true"/>{error}</div> : null}

    <div className={styles.layout}>
      <main id="brain-sections" className={styles.sections}>
        {model.sections.map((section) => <article className={styles.section} key={section.id}>
          <header className={styles.sectionHeader}>
            <div><h2>{section.title}</h2><span className={styles[section.status]}>{section.status}</span></div>
          </header>

          {section.chips?.length ? <div className={styles.chips}>{section.chips.map((chip) => <span key={chip}>{chip}</span>)}</div> : null}

          {section.chipEditors.map((field) => <button
            type="button"
            className={styles.attributeEdit}
            key={`edit-${field.fieldKey}`}
            onClick={() => setEditing({ fieldKey: field.fieldKey, label: field.label, value: field.value, section: field.section, version: field.version })}
          ><Edit3 aria-hidden="true"/>Edit {field.label}<small>{field.originLabel} · {field.confidenceLabel}</small></button>)}

          <div className={styles.fieldList}>
            {section.fields.map((field) => <BrainField key={field.fieldKey} field={field} onEdit={() => setEditing({ fieldKey: field.fieldKey, label: field.label, value: field.value ?? "", section: field.section, version: field.version })}/>) }
          </div>
        </article>)}
      </main>

      <aside className={styles.sidebar}>
        <section className={styles.readinessCard}>
          <header><span><ShieldCheck aria-hidden="true"/>Hunter readiness</span><strong>{model.activation.hunterReady ? "Ready" : "Not ready"}</strong></header>
          <p>{model.activation.hunterReady ? "Hunter has enough high-confidence Brand context to start background discovery." : "Resolve the highest-impact gaps before Hunter relies on this Brain."}</p>
          <div className={styles.progress}><span style={{ width: `${model.activation.completenessScore}%` }}/></div>
          <small>{model.activation.completenessScore}% core context complete</small>
        </section>

        <section className={styles.actionCard}>
          <header><Database aria-hidden="true"/><h2>Improve Brand Brain</h2></header>
          {model.activation.recommendedSources.length ? <div className={styles.recommendations}>
            {model.activation.recommendedSources.slice(0, 4).map((item) => {
              const target = item.type === "confirm-field" && item.fieldKey ? findEditTarget(model, item.fieldKey) : undefined;
              return target ? <button key={`${item.type}-${item.fieldKey ?? item.gap}`} type="button" onClick={() => setEditing(target)}>
                <strong>{item.label}</strong><small>{item.reason}</small>
              </button> : <div className={styles.recommendationNote} key={`${item.type}-${item.fieldKey ?? item.gap}`}>
                <strong>{item.label}</strong><small>{item.reason}</small>
              </div>;
            })}
          </div> : <p className={styles.clearState}><Check aria-hidden="true"/>No blocking Brand Brain gaps.</p>}
          <label className={styles.sourceInput}><span>Add another source</span><input value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="Website, Instagram, LinkedIn or other public URL" inputMode="url" disabled={!brandId || busy}/></label>
          <button className={styles.addSource} type="button" onClick={addSource} disabled={!brandId || !sourceUrl.trim() || busy}><Plus aria-hidden="true"/>{busy ? "Updating…" : "Add source & recalculate"}</button>
        </section>

        <section className={styles.evidenceCard}>
          <header><h2>Evidence sources</h2><span>{model.sources.filter((source) => source.status === "active").length} active</span></header>
          {model.sources.filter((source) => source.status === "active").slice(0, 5).map((source) => <div key={source.id}><span><Database aria-hidden="true"/><strong>{source.title ?? source.type}</strong></span>{source.sourceUrl ? <a href={source.sourceUrl} target="_blank" rel="noreferrer" aria-label={`Open ${source.title ?? "source"}`}><ExternalLink aria-hidden="true"/></a> : null}</div>)}
          {!model.sources.length ? <p>No registered sources yet.</p> : null}
        </section>
      </aside>
    </div>

    {editing ? <div className={styles.modalBackdrop} role="presentation" onMouseDown={() => !busy && setEditing(null)}>
      <section className={styles.editor} role="dialog" aria-modal="true" aria-labelledby="brain-field-editor-title" onMouseDown={(event) => event.stopPropagation()}>
        <header><div><small>Confirm Brand context</small><h2 id="brain-field-editor-title">{editing.label}</h2></div><button type="button" onClick={() => setEditing(null)} disabled={busy} aria-label="Close editor"><X aria-hidden="true"/></button></header>
        <textarea value={editing.value} onChange={(event) => setEditing({ ...editing, value: event.target.value })} rows={6} autoFocus/>
        <p>Saving this makes the value <strong>user confirmed</strong>. Future source refreshes cannot silently overwrite it.</p>
        <footer><button type="button" onClick={() => setEditing(null)} disabled={busy}>Cancel</button><button type="button" className={styles.save} onClick={saveField} disabled={busy || !editing.value.trim()}><Check aria-hidden="true"/>{busy ? "Saving…" : "Save & confirm"}</button></footer>
      </section>
    </div> : null}
  </div>;
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <article><small>{label}</small><strong>{value}</strong><span>{detail}</span></article>;
}

function BrainField({ field, onEdit }: { field: EditableBrainField; onEdit: () => void }) {
  return <div className={`${styles.field} ${field.needsReview ? styles.review : ""}`}>
    <div className={styles.fieldCopy}><small>{field.label}</small><p className={!field.value ? styles.unknown : ""}>{field.value ?? "Unknown"}</p></div>
    <div className={styles.fieldMeta}>
      <span className={styles.origin}>{field.originLabel}</span>
      <span className={styles.confidence}>{field.confidenceLabel}</span>
      {field.evidenceCount ? <span>{field.evidenceCount} source{field.evidenceCount === 1 ? "" : "s"}</span> : null}
      <button type="button" onClick={onEdit}><Edit3 aria-hidden="true"/>Edit</button>
    </div>
  </div>;
}

function findEditTarget(model: BrandBrainPageViewModel, fieldKey: string): EditTarget | undefined {
  for (const section of model.sections) {
    const field = section.fields.find((candidate) => candidate.fieldKey === fieldKey);
    if (field) return { fieldKey: field.fieldKey, label: field.label, value: field.value ?? "", section: field.section, version: field.version };
    const chip = section.chipEditors.find((candidate) => candidate.fieldKey === fieldKey);
    if (chip) return { fieldKey: chip.fieldKey, label: chip.label, value: chip.value, section: chip.section, version: chip.version };
  }
  return undefined;
}

async function mutate(body: Record<string, unknown>) {
  const response = await fetch("/api/brain", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const payload = await response.json().catch(() => null) as { error?: string } | null;
  if (!response.ok) throw new Error(payload?.error ?? "Kairo could not update Brand Brain.");
  return payload;
}
