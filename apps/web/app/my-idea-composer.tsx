"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { HomeCreationFormat, MyIdeaRecommendation } from "../src/lib/home-intelligence";
import { KairoIcon } from "./kairo-icons";
import styles from "./home-vs85.module.css";
import mediaStyles from "./home-media.module.css";

type EligiblePresenter = { id: string; displayName: string; mode: string };
type Props = { brandId: string; initialText?: string; eligiblePresenter?: EligiblePresenter };
type RecommendResponse = { recommendation?: MyIdeaRecommendation; error?: string };
type CreateResponse = { href?: string; error?: string };
type HomeMediaAsset = {
  id: string;
  name: string;
  kind: "image" | "video";
  mimeType: string;
  sizeBytes: number;
  previewUrl: string;
  createdAt: string;
};
type BeginUploadResponse = {
  uploadId?: string;
  uploadUrl?: string;
  headers?: { "content-type"?: string };
  detail?: string;
};
type MediaResponse = HomeMediaAsset & { detail?: string };

const formatLabels: Record<HomeCreationFormat, string> = { carousel: "Carousel", reel: "Reel", image: "Post" };
const MAX_MEDIA = 12;

export function MyIdeaComposer({ brandId, initialText = "", eligiblePresenter }: Props) {
  const router = useRouter();
  const photoInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const mediaDialog = useRef<HTMLDialogElement>(null);
  const [idea, setIdea] = useState(initialText);
  const [source, setSource] = useState("");
  const [showUrl, setShowUrl] = useState(false);
  const [recommendation, setRecommendation] = useState<MyIdeaRecommendation | null>(null);
  const [format, setFormat] = useState<HomeCreationFormat | "">("");
  const [presenterId, setPresenterId] = useState("");
  const [attachedMedia, setAttachedMedia] = useState<HomeMediaAsset[]>([]);
  const [library, setLibrary] = useState<HomeMediaAsset[]>([]);
  const [librarySelection, setLibrarySelection] = useState<string[]>([]);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [libraryState, setLibraryState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [uploading, setUploading] = useState<"image" | "video" | null>(null);
  const [state, setState] = useState<"idle" | "recommending" | "creating">("idle");
  const [error, setError] = useState("");
  const [mediaError, setMediaError] = useState("");
  const canRecommend = idea.trim().length >= 4 || isHttpUrl(source.trim()) || attachedMedia.length > 0;
  const busy = state !== "idle" || uploading !== null;

  useEffect(() => {
    const dialog = mediaDialog.current;
    if (!dialog) return;
    if (mediaOpen && !dialog.open) dialog.showModal();
    if (!mediaOpen && dialog.open) dialog.close();
  }, [mediaOpen]);

  function invalidateRecommendation() {
    setRecommendation(null);
    setFormat("");
    setError("");
  }

  async function recommend() {
    if (!canRecommend || busy) return;
    setState("recommending");
    setError("");
    try {
      const response = await fetch("/api/home/my-idea", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          brandId,
          text: idea.trim(),
          source: source.trim() || undefined,
          mediaAssetIds: attachedMedia.map((item) => item.id),
        }),
      });
      const body = (await response.json().catch(() => ({}))) as RecommendResponse;
      if (!response.ok || !body.recommendation) throw new Error(body.error ?? "Kairo could not recommend a format.");
      setRecommendation(body.recommendation);
      setFormat(body.recommendation.format);
      setState("idle");
    } catch (caught) {
      setRecommendation(null);
      setFormat("");
      setState("idle");
      setError(caught instanceof Error ? caught.message : "Kairo could not recommend a format.");
    }
  }

  async function create() {
    if (!recommendation || !format || state !== "idle" || uploading) return;
    setState("creating");
    setError("");
    try {
      const response = await fetch("/api/home/my-idea", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          brandId,
          text: idea.trim(),
          source: source.trim() || undefined,
          format,
          presenterId: presenterId || undefined,
          mediaAssetIds: attachedMedia.map((item) => item.id),
        }),
      });
      const body = (await response.json().catch(() => ({}))) as CreateResponse;
      if (!response.ok || !body.href) throw new Error(body.error ?? "Kairo could not start this creation.");
      router.push(body.href);
    } catch (caught) {
      setState("idle");
      setError(caught instanceof Error ? caught.message : "Kairo could not start this creation.");
    }
  }

  async function uploadFile(file: File, expected: "image" | "video") {
    if (attachedMedia.length >= MAX_MEDIA) {
      setMediaError(`You can attach up to ${MAX_MEDIA} media items.`);
      return;
    }
    if (!file.type.startsWith(`${expected}/`) && !(expected === "video" && file.type === "application/octet-stream")) {
      setMediaError(expected === "image" ? "Choose a JPEG, PNG, or WebP image." : "Choose an MP4, MOV, or WebM video.");
      return;
    }
    setUploading(expected);
    setMediaError("");
    try {
      const begin = await fetch("/api/home/media", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ brandId, action: "begin", name: file.name, mimeType: file.type, sizeBytes: file.size }),
      });
      const started = (await begin.json().catch(() => ({}))) as BeginUploadResponse;
      if (!begin.ok || !started.uploadId || !started.uploadUrl) throw new Error(started.detail ?? "Kairo could not prepare the upload.");

      const stored = await fetch(started.uploadUrl, {
        method: "PUT",
        headers: { "content-type": started.headers?.["content-type"] ?? file.type },
        body: file,
      });
      if (!stored.ok) throw new Error("The media upload did not complete. Check storage access and try again.");

      const complete = await fetch("/api/home/media", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ brandId, action: "complete", uploadId: started.uploadId }),
      });
      const item = (await complete.json().catch(() => ({}))) as MediaResponse;
      if (!complete.ok || !item.id) throw new Error(item.detail ?? "Kairo could not verify the uploaded media.");
      attachMedia(item);
      setLibrary((items) => uniqueMedia([item, ...items]));
    } catch (caught) {
      setMediaError(caught instanceof Error ? caught.message : "Kairo could not upload this media.");
    } finally {
      setUploading(null);
    }
  }

  async function openMediaLibrary() {
    if (busy) return;
    setLibrarySelection(attachedMedia.map((item) => item.id));
    setMediaError("");
    setMediaOpen(true);
    setLibraryState("loading");
    try {
      const response = await fetch(`/api/home/media?brandId=${encodeURIComponent(brandId)}`, { cache: "no-store" });
      const body = (await response.json().catch(() => null)) as HomeMediaAsset[] | { detail?: string } | null;
      if (!response.ok || !Array.isArray(body)) throw new Error(!Array.isArray(body) ? body?.detail ?? "Media library is unavailable." : "Media library is unavailable.");
      setLibrary(body);
      setLibraryState("ready");
    } catch (caught) {
      setLibrary([]);
      setLibraryState("error");
      setMediaError(caught instanceof Error ? caught.message : "Media library is unavailable.");
    }
  }

  function attachMedia(item: HomeMediaAsset) {
    setAttachedMedia((items) => uniqueMedia([...items, item]).slice(0, MAX_MEDIA));
    invalidateRecommendation();
  }

  function removeMedia(id: string) {
    setAttachedMedia((items) => items.filter((item) => item.id !== id));
    setLibrarySelection((items) => items.filter((item) => item !== id));
    invalidateRecommendation();
  }

  function toggleLibraryItem(id: string) {
    setLibrarySelection((items) => {
      if (items.includes(id)) return items.filter((item) => item !== id);
      if (items.length >= MAX_MEDIA) {
        setMediaError(`You can attach up to ${MAX_MEDIA} media items.`);
        return items;
      }
      setMediaError("");
      return [...items, id];
    });
  }

  function applyLibrarySelection() {
    const selected = library.filter((item) => librarySelection.includes(item.id));
    const outsideLibrary = attachedMedia.filter((item) => !library.some((asset) => asset.id === item.id));
    setAttachedMedia(uniqueMedia([...outsideLibrary, ...selected]).slice(0, MAX_MEDIA));
    invalidateRecommendation();
    setMediaOpen(false);
  }

  return (
    <div className={styles.ideaComposerWrap}>
      <div className={styles.ideaComposer}>
        <textarea
          id="home-my-idea"
          aria-label="Your idea"
          value={idea}
          onChange={(event) => { setIdea(event.target.value); invalidateRecommendation(); }}
          placeholder="What do you want to create?"
          rows={2}
          maxLength={4000}
        />
        {showUrl ? (
          <input
            className={styles.urlField}
            aria-label="Idea source URL"
            type="url"
            value={source}
            onChange={(event) => { setSource(event.target.value); invalidateRecommendation(); }}
            placeholder="https://…"
            maxLength={2000}
            inputMode="url"
          />
        ) : null}

        {attachedMedia.length ? (
          <div className={mediaStyles.attachmentStrip} aria-label="Attached media">
            {attachedMedia.map((item) => (
              <div className={mediaStyles.attachmentChip} key={item.id}>
                <span className={mediaStyles.attachmentPreview} data-kind={item.kind}>
                  {item.kind === "image" ? <img src={item.previewUrl} alt="" /> : <KairoIcon name="video" />}
                </span>
                <span className={mediaStyles.attachmentName}>{item.name}</span>
                <button type="button" onClick={() => removeMedia(item.id)} aria-label={`Remove ${item.name}`}>×</button>
              </div>
            ))}
          </div>
        ) : null}

        <div className={styles.composerTools} aria-label="Idea sources">
          <button className={styles.toolButton} data-tone="url" type="button" aria-pressed={showUrl} onClick={() => { setShowUrl((value) => !value); if (showUrl) setSource(""); invalidateRecommendation(); }}><KairoIcon name="link" /><span>URL</span></button>
          <button className={styles.toolButton} data-tone="photo" type="button" disabled={busy} onClick={() => photoInput.current?.click()}><KairoIcon name="image" /><span>{uploading === "image" ? "Uploading…" : "Photo"}</span></button>
          <button className={styles.toolButton} data-tone="video" type="button" disabled={busy} onClick={() => videoInput.current?.click()}><KairoIcon name="video" /><span>{uploading === "video" ? "Uploading…" : "Video"}</span></button>
          <button className={styles.toolButton} data-tone="media" type="button" disabled={busy} onClick={openMediaLibrary}><KairoIcon name="plus" /><span>Media</span></button>
        </div>
        <input ref={photoInput} className={mediaStyles.fileInput} type="file" accept="image/jpeg,image/png,image/webp" tabIndex={-1} onChange={(event) => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; if (file) void uploadFile(file, "image"); }} />
        <input ref={videoInput} className={mediaStyles.fileInput} type="file" accept="video/mp4,video/quicktime,video/webm" tabIndex={-1} onChange={(event) => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; if (file) void uploadFile(file, "video"); }} />
      </div>

      {mediaError && !mediaOpen ? <p className={mediaStyles.mediaError} role="alert">{mediaError}</p> : null}

      <button className={styles.recommendButton} type="button" onClick={recommend} disabled={!canRecommend || busy}>
        <KairoIcon name="sparkles" />
        <span>{state === "recommending" ? "Getting recommendations…" : recommendation ? "Update recommendations" : "Get recommendations"}</span>
      </button>

      <p className={styles.recommendationHint}><KairoIcon name="shield" /><span>Kairo recommends the format before it creates anything.</span></p>

      <div className={styles.recommendationSlot} aria-live="polite" aria-atomic="true">
        {recommendation ? (
          <div className={`${styles.recommendationResult} ${mediaStyles.creationControls}`}>
            <div className={mediaStyles.recommendationCopy}><span>Kairo recommends</span><strong>{formatLabels[recommendation.format]}</strong><p>{recommendation.reason}</p></div>
            <label className={mediaStyles.controlField}><span>Format</span><select value={format} onChange={(event) => setFormat(event.target.value as HomeCreationFormat)}>{recommendation.choices.map((choice) => <option key={choice} value={choice}>{formatLabels[choice]}</option>)}</select></label>
            {eligiblePresenter ? (
              <label className={mediaStyles.controlField}>
                <span>Presenter</span>
                <select value={presenterId} onChange={(event) => setPresenterId(event.target.value)}>
                  <option value="">None</option>
                  <option value={eligiblePresenter.id}>{eligiblePresenter.displayName}</option>
                </select>
              </label>
            ) : null}
            <button className={mediaStyles.generateButton} type="button" onClick={create} disabled={!format || state !== "idle" || uploading !== null}>
              <KairoIcon name="sparkles" />
              <span>{state === "creating" ? "Generating…" : "AI Generate"}</span>
            </button>
          </div>
        ) : null}
      </div>
      {error ? <p className={styles.inlineError} role="alert">{error}</p> : null}

      <dialog ref={mediaDialog} className={mediaStyles.mediaDialog} onClose={() => setMediaOpen(false)} aria-labelledby="home-media-title">
        <div className={mediaStyles.dialogHeader}>
          <div><h3 id="home-media-title">Media</h3><p>Reuse photos and videos already saved for this Brand.</p></div>
          <button type="button" className={mediaStyles.closeButton} onClick={() => setMediaOpen(false)} aria-label="Close media library">×</button>
        </div>
        <div className={mediaStyles.dialogBody}>
          {libraryState === "loading" ? <p className={mediaStyles.libraryState} role="status">Loading media…</p> : null}
          {libraryState === "error" ? <p className={mediaStyles.libraryState} role="alert">{mediaError || "Media library is unavailable."}</p> : null}
          {libraryState === "ready" && library.length === 0 ? <p className={mediaStyles.libraryState}>No media yet. Upload a Photo or Video and it will appear here.</p> : null}
          {libraryState === "ready" && library.length ? (
            <div className={mediaStyles.mediaGrid}>
              {library.map((item) => {
                const selected = librarySelection.includes(item.id);
                return (
                  <button key={item.id} type="button" className={mediaStyles.mediaItem} data-selected={selected} aria-pressed={selected} onClick={() => toggleLibraryItem(item.id)}>
                    <span className={mediaStyles.mediaThumb} data-kind={item.kind}>
                      {item.kind === "image" ? <img src={item.previewUrl} alt="" /> : <KairoIcon name="video" />}
                      {selected ? <span className={mediaStyles.selectedMark}><KairoIcon name="check" /></span> : null}
                    </span>
                    <span className={mediaStyles.mediaItemName}>{item.name}</span>
                    <span className={mediaStyles.mediaItemMeta}>{item.kind === "image" ? "Photo" : "Video"} · {formatBytes(item.sizeBytes)}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
          {mediaError && libraryState === "ready" ? <p className={mediaStyles.mediaError} role="alert">{mediaError}</p> : null}
        </div>
        <div className={mediaStyles.dialogFooter}>
          <span>{librarySelection.length} selected</span>
          <button type="button" onClick={applyLibrarySelection} disabled={libraryState !== "ready"}>Use media</button>
        </div>
      </dialog>
    </div>
  );
}

function uniqueMedia(items: HomeMediaAsset[]) {
  const seen = new Set<string>();
  return items.filter((item) => !seen.has(item.id) && seen.add(item.id));
}
function isHttpUrl(value: string) {
  try { const parsed = new URL(value); return parsed.protocol === "http:" || parsed.protocol === "https:"; }
  catch { return false; }
}
function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "—";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}
