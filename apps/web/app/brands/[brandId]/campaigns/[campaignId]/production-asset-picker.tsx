"use client";

import { useMemo, useState } from "react";
import type { ContentAssetKind, ContentAssetLibraryView, ContentLibraryAssetView } from "../../../../../src/lib/content-asset-library-api";
import styles from "./production-asset-picker.module.css";

type AssetReference = {
  libraryId:string;libraryAssetId:string;libraryName:string;provider:"google-drive"|"manual";externalId:string;name:string;kind:ContentAssetKind;mimeType:string;providerRef?:string;previewRef?:string;indexedAt:string;
};
type Candidate = {
  id:string;name:string;kind:ContentAssetKind;mimeType:string;libraryName:string;provider:"google-drive"|"manual";historical:boolean;
};

export function ProductionAssetPicker({
  libraries,
  assets,
  current,
  unavailable,
  contentAssetsHref,
  action,
}: {
  libraries:ContentAssetLibraryView[];
  assets:ContentLibraryAssetView[];
  current:AssetReference[];
  unavailable:boolean;
  contentAssetsHref:string;
  action:(formData:FormData)=>Promise<void>;
}) {
  const currentIds = useMemo(() => current.map((item) => item.libraryAssetId), [current]);
  const [selected, setSelected] = useState<string[]>(currentIds);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"all"|ContentAssetKind>("all");
  const libraryMap = useMemo(() => new Map(libraries.map((library) => [library.id, library])), [libraries]);
  const candidates = useMemo(() => {
    const byId = new Map<string, Candidate>();
    for (const asset of assets) {
      const library = libraryMap.get(asset.libraryId);
      if (!library) continue;
      byId.set(asset.id, { id:asset.id,name:asset.name,kind:asset.kind,mimeType:asset.mimeType,libraryName:library.name,provider:library.provider,historical:false });
    }
    for (const ref of current) {
      if (!byId.has(ref.libraryAssetId)) byId.set(ref.libraryAssetId, { id:ref.libraryAssetId,name:ref.name,kind:ref.kind,mimeType:ref.mimeType,libraryName:ref.libraryName,provider:ref.provider,historical:true });
    }
    return [...byId.values()].sort((a,b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
  }, [assets, current, libraryMap]);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filtered = candidates.filter((candidate) => {
    if (kind !== "all" && candidate.kind !== kind) return false;
    if (!normalizedQuery) return true;
    return `${candidate.name} ${candidate.mimeType} ${candidate.libraryName} ${candidate.provider}`.toLocaleLowerCase().includes(normalizedQuery);
  });
  const visible = filtered.slice(0, 80);
  const changed = selected.length !== currentIds.length || selected.some((id, index) => id !== currentIds[index]);

  function toggle(id:string) {
    setSelected((existing) => {
      if (existing.includes(id)) return existing.filter((item) => item !== id);
      if (existing.length >= 12) return existing;
      return [...existing, id];
    });
  }

  if (unavailable) {
    return (
      <div className={styles.state} role="status">
        <strong>Production assets are temporarily unavailable</strong>
        <p>Content editing and review remain available. Kairo did not contact any external provider for this panel.</p>
      </div>
    );
  }

  if (!candidates.length && !current.length) {
    return (
      <div className={styles.state}>
        <strong>No indexed production assets yet</strong>
        <p>Create or connect a Content Asset Library, then index the files you want available to Content Studio.</p>
        <a className="secondary-button" href={contentAssetsHref}>Open Content Assets</a>
      </div>
    );
  }

  return (
    <form action={action} className={styles.picker}>
      {selected.map((id) => <input key={id} type="hidden" name="libraryAssetId" value={id} />)}

      <div className={styles.selected} aria-live="polite">
        <div>
          <strong>{selected.length} selected</strong>
          <span> · Maximum 12</span>
        </div>
        {selected.length ? <button className={styles.clearButton} type="button" onClick={() => setSelected([])}>Clear all</button> : null}
      </div>

      {selected.length ? (
        <div className={styles.chips} aria-label="Selected production assets">
          {selected.map((id) => {
            const item = candidates.find((candidate) => candidate.id === id);
            return item ? <button key={id} type="button" className={styles.chip} onClick={() => toggle(id)} aria-label={`Remove ${item.name}`}><span>{item.name}</span><small>{item.libraryName}</small><b aria-hidden="true">×</b></button> : null;
          })}
        </div>
      ) : <p className={styles.emptySelection}>No production assets are attached to this version.</p>}

      <div className={styles.filters}>
        <label>
          Search production assets
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, type or library" />
        </label>
        <label>
          Kind
          <select value={kind} onChange={(event) => setKind(event.target.value as "all"|ContentAssetKind)}>
            <option value="all">All kinds</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="document">Documents</option>
            <option value="other">Other</option>
          </select>
        </label>
      </div>

      <div className={styles.options} role="group" aria-label="Available production assets">
        {visible.length ? visible.map((candidate) => {
          const checked = selected.includes(candidate.id);
          const atLimit = selected.length >= 12 && !checked;
          return (
            <label className={styles.option} key={candidate.id}>
              <input type="checkbox" checked={checked} disabled={atLimit} onChange={() => toggle(candidate.id)} />
              <span className={styles.optionCopy}>
                <strong>{candidate.name}</strong>
                <small>{candidate.kind} · {candidate.libraryName} · {candidate.provider === "google-drive" ? "Google Drive" : "Manual"}{candidate.historical ? " · Historical reference" : ""}</small>
              </span>
            </label>
          );
        }) : <p className={styles.noMatch}>No production assets match this filter.</p>}
      </div>
      {filtered.length > visible.length ? <p className={styles.limit}>Showing the first 80 matches. Refine search to find a specific asset.</p> : null}

      <div className={styles.footer}>
        <p>References only. Kairo does not download, copy, transform or publish provider files in this step.</p>
        <button className="secondary-button" type="submit" disabled={!changed}>Save as new version</button>
      </div>
    </form>
  );
}
