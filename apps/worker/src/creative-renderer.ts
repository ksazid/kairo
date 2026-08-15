import { createHash } from "node:crypto";
import { deflateSync } from "node:zlib";
import {
  validateCarouselPlan,
  validateReelPlan,
  type MarketingCreativePlan,
} from "@kairo/domain/creative-formats";

export const CREATIVE_RENDERER_VERSION = "kairo-bitmap-v1";
const PNG_SIGNATURE = Buffer.from([137,80,78,71,13,10,26,10]);

type Rgb = readonly [number, number, number];
export interface CreativeRenderTheme {
  width?: number;
  height?: number;
  background?: Rgb;
  foreground?: Rgb;
  accent?: Rgb;
}
export type CreativeArtifactRole = "carousel-slide" | "reel-storyboard" | "reel-render-manifest";
export interface RenderedCreativeArtifact {
  role: CreativeArtifactRole;
  filename: string;
  contentType: "image/png" | "application/vnd.kairo.reel-render+json";
  bytes: Uint8Array;
  sha256: string;
  supportingClaimIds: string[];
  index: number;
}
export interface CreativeRenderPackage {
  format: "carousel" | "reel";
  rendererVersion: string;
  sourceFingerprint: string;
  artifacts: RenderedCreativeArtifact[];
}
export interface CreativeScope { workspaceId: string; brandId: string }
export interface CreativeObjectStorePort {
  putPrivateObject(input: {
    workspaceId: string;
    brandId: string;
    objectKey: string;
    contentType: string;
    contentHash: string;
    bytes: Uint8Array;
  }): Promise<{ objectId: string }>;
}
export interface StoredCreativeAsset {
  objectId: string;
  objectKey: string;
  role: CreativeArtifactRole;
  filename: string;
  contentType: string;
  contentHash: string;
  sizeBytes: number;
  supportingClaimIds: string[];
  index: number;
}
export interface StoredCreativePackage {
  format: "carousel" | "reel";
  rendererVersion: string;
  sourceFingerprint: string;
  assets: StoredCreativeAsset[];
}

export function renderCreativePlan(plan: MarketingCreativePlan, theme: CreativeRenderTheme = {}): CreativeRenderPackage {
  if (plan.format === "carousel") return renderCarousel(validateCarouselPlan(plan), normalizeTheme("carousel", theme));
  return renderReel(validateReelPlan(plan), normalizeTheme("reel", theme));
}

export class CreativeAssetProductionService {
  private readonly maxArtifactBytes: number;
  private readonly maxPackageBytes: number;
  constructor(private readonly store: CreativeObjectStorePort, options: { maxArtifactBytes?: number; maxPackageBytes?: number } = {}) {
    this.maxArtifactBytes = boundedPositive(options.maxArtifactBytes ?? 12 * 1024 * 1024, "maxArtifactBytes", 128 * 1024 * 1024);
    this.maxPackageBytes = boundedPositive(options.maxPackageBytes ?? 80 * 1024 * 1024, "maxPackageBytes", 512 * 1024 * 1024);
  }
  async produce(scopeInput: CreativeScope, plan: MarketingCreativePlan, theme: CreativeRenderTheme = {}): Promise<StoredCreativePackage> {
    const scope = validateScope(scopeInput);
    const rendered = renderCreativePlan(plan, theme);
    let total = 0;
    for (const artifact of rendered.artifacts) {
      if (artifact.bytes.byteLength > this.maxArtifactBytes) throw new Error("Generated artifact size exceeds configured artifact size bound");
      total += artifact.bytes.byteLength;
    }
    if (total > this.maxPackageBytes) throw new Error("Generated package size exceeds configured package size bound");
    const scopeKey = sha256(Buffer.from(`${scope.workspaceId}\u0000${scope.brandId}`)).slice(0, 24);
    const assets: StoredCreativeAsset[] = [];
    for (const artifact of rendered.artifacts) {
      const objectKey = `generated/${scopeKey}/${rendered.format}/${rendered.sourceFingerprint}/${artifact.filename}`;
      const stored = await this.store.putPrivateObject({
        workspaceId: scope.workspaceId,
        brandId: scope.brandId,
        objectKey,
        contentType: artifact.contentType,
        contentHash: artifact.sha256,
        bytes: artifact.bytes,
      });
      if (!stored?.objectId || typeof stored.objectId !== "string") throw new Error("Generated media store did not return an object identifier");
      assets.push({
        objectId: stored.objectId,
        objectKey,
        role: artifact.role,
        filename: artifact.filename,
        contentType: artifact.contentType,
        contentHash: artifact.sha256,
        sizeBytes: artifact.bytes.byteLength,
        supportingClaimIds: [...artifact.supportingClaimIds],
        index: artifact.index,
      });
    }
    return { format: rendered.format, rendererVersion: rendered.rendererVersion, sourceFingerprint: rendered.sourceFingerprint, assets };
  }
}

interface NormalizedTheme { width: number; height: number; background: Rgb; foreground: Rgb; accent: Rgb }
function normalizeTheme(format: "carousel" | "reel", input: CreativeRenderTheme): NormalizedTheme {
  const width = dimension(input.width ?? 1080, "width", 64, 2160);
  const height = dimension(input.height ?? (format === "carousel" ? 1080 : 1920), "height", 64, 3840);
  return {
    width,
    height,
    background: color(input.background ?? [247,247,244], "background"),
    foreground: color(input.foreground ?? [24,24,24], "foreground"),
    accent: color(input.accent ?? [72,92,75], "accent"),
  };
}
function dimension(value: number, field: string, min: number, max: number): number {
  if (!Number.isInteger(value) || value < min || value > max) throw new Error(`Creative ${field} must be an integer between ${min} and ${max}`);
  return value;
}
function color(value: Rgb, field: string): Rgb {
  if (!Array.isArray(value) || value.length !== 3 || value.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) throw new Error(`Creative ${field} color is invalid`);
  return [value[0], value[1], value[2]];
}
function validateScope(input: CreativeScope): CreativeScope {
  return { workspaceId: scopeText(input?.workspaceId, "workspaceId"), brandId: scopeText(input?.brandId, "brandId") };
}
function scopeText(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > 200) throw new Error(`${field} is required`);
  return value.trim();
}
function boundedPositive(value: number, field: string, max: number): number {
  if (!Number.isInteger(value) || value <= 0 || value > max) throw new Error(`${field} is invalid`);
  return value;
}

function renderCarousel(plan: ReturnType<typeof validateCarouselPlan>, theme: NormalizedTheme): CreativeRenderPackage {
  const sourceFingerprint = fingerprint(plan, theme);
  const artifacts = plan.slides.map((slide, index) => {
    const canvas = new Canvas(theme.width, theme.height, theme.background);
    const pad = Math.max(12, Math.floor(theme.width * 0.075));
    const headScale = Math.max(2, Math.floor(theme.width / 90));
    const bodyScale = Math.max(2, Math.floor(theme.width / 150));
    canvas.fillRect(0, 0, theme.width, Math.max(5, Math.floor(theme.height * 0.025)), theme.accent);
    let y = pad;
    if (index === 0) y = canvas.drawWrapped(plan.coverHook, pad, y, theme.width - pad * 2, headScale, theme.accent, 3) + bodyScale * 3;
    y = canvas.drawWrapped(slide.headline, pad, y, theme.width - pad * 2, headScale, theme.foreground, 4) + bodyScale * 3;
    canvas.drawWrapped(slide.body, pad, y, theme.width - pad * 2, bodyScale, theme.foreground, 12);
    if (index === plan.slides.length - 1) canvas.drawWrapped(plan.cta, pad, theme.height - pad - bodyScale * 12, theme.width - pad * 2, bodyScale, theme.accent, 3);
    const bytes = encodePng(canvas);
    return artifact("carousel-slide", `carousel-${String(index + 1).padStart(2,"0")}.png`, "image/png", bytes, slide.supportingClaimIds, index);
  });
  return { format: "carousel", rendererVersion: CREATIVE_RENDERER_VERSION, sourceFingerprint, artifacts };
}

function renderReel(plan: ReturnType<typeof validateReelPlan>, theme: NormalizedTheme): CreativeRenderPackage {
  const sourceFingerprint = fingerprint(plan, theme);
  const frames = plan.scenes.map((scene, index) => {
    const canvas = new Canvas(theme.width, theme.height, theme.background);
    const pad = Math.max(12, Math.floor(theme.width * 0.075));
    const hookScale = Math.max(2, Math.floor(theme.width / 90));
    const textScale = Math.max(2, Math.floor(theme.width / 145));
    canvas.fillRect(0, 0, Math.max(6, Math.floor(theme.width * 0.025)), theme.height, theme.accent);
    let y = pad;
    y = canvas.drawWrapped(plan.hook, pad * 1.5, y, theme.width - pad * 2.5, hookScale, theme.accent, 4) + textScale * 8;
    y = canvas.drawWrapped(scene.onScreenText, pad * 1.5, y, theme.width - pad * 2.5, hookScale, theme.foreground, 7) + textScale * 10;
    canvas.drawWrapped(`SCENE ${index + 1}  ${scene.startSecond}-${scene.endSecond} SEC`, pad * 1.5, theme.height - pad - textScale * 28, theme.width - pad * 2.5, textScale, theme.accent, 2);
    canvas.drawWrapped(scene.visual, pad * 1.5, theme.height - pad - textScale * 16, theme.width - pad * 2.5, textScale, theme.foreground, 4);
    const bytes = encodePng(canvas);
    return artifact("reel-storyboard", `reel-scene-${String(index + 1).padStart(2,"0")}.png`, "image/png", bytes, scene.supportingClaimIds, index);
  });
  const manifestObject = {
    schemaVersion: 1,
    rendererVersion: CREATIVE_RENDERER_VERSION,
    sourceFingerprint,
    format: "reel",
    targetDurationSeconds: plan.targetDurationSeconds,
    hook: plan.hook,
    caption: plan.caption,
    cta: plan.cta,
    supportingClaimIds: plan.supportingClaimIds,
    scenes: plan.scenes.map((scene, index) => ({
      index,
      startSecond: scene.startSecond,
      endSecond: scene.endSecond,
      visual: scene.visual,
      onScreenText: scene.onScreenText,
      voiceover: scene.voiceover,
      supportingClaimIds: scene.supportingClaimIds,
      storyboardFilename: frames[index]!.filename,
      storyboardSha256: frames[index]!.sha256,
    })),
  };
  const manifestBytes = new TextEncoder().encode(JSON.stringify(manifestObject));
  const manifest = artifact("reel-render-manifest", "reel-render.json", "application/vnd.kairo.reel-render+json", manifestBytes, plan.supportingClaimIds, plan.scenes.length);
  return { format: "reel", rendererVersion: CREATIVE_RENDERER_VERSION, sourceFingerprint, artifacts: [...frames, manifest] };
}

function fingerprint(plan: MarketingCreativePlan, theme: NormalizedTheme): string {
  return sha256(Buffer.from(JSON.stringify({ rendererVersion: CREATIVE_RENDERER_VERSION, plan, theme }))); 
}
function artifact(role: CreativeArtifactRole, filename: string, contentType: RenderedCreativeArtifact["contentType"], bytes: Uint8Array, supportingClaimIds: string[], index: number): RenderedCreativeArtifact {
  return { role, filename, contentType, bytes, sha256: sha256(bytes), supportingClaimIds: [...supportingClaimIds], index };
}
function sha256(value: Uint8Array): string { return createHash("sha256").update(value).digest("hex"); }

class Canvas {
  readonly pixels: Uint8Array;
  constructor(readonly width: number, readonly height: number, background: Rgb) {
    this.pixels = new Uint8Array(width * height * 3);
    this.fillRect(0, 0, width, height, background);
  }
  fillRect(x: number, y: number, width: number, height: number, color: Rgb): void {
    const x0 = Math.max(0, Math.floor(x)), y0 = Math.max(0, Math.floor(y));
    const x1 = Math.min(this.width, Math.ceil(x + width)), y1 = Math.min(this.height, Math.ceil(y + height));
    for (let py = y0; py < y1; py++) for (let px = x0; px < x1; px++) this.pixel(px, py, color);
  }
  drawWrapped(text: string, x: number, y: number, maxWidth: number, scale: number, color: Rgb, maxLines: number): number {
    const lines = wrap(text, Math.max(1, Math.floor(maxWidth / (4 * scale))), maxLines);
    let cursorY = Math.floor(y);
    for (const line of lines) { this.drawLine(line, Math.floor(x), cursorY, scale, color); cursorY += 7 * scale; }
    return cursorY;
  }
  private drawLine(text: string, x: number, y: number, scale: number, color: Rgb): void {
    let cursor = x;
    for (const char of text.toUpperCase()) {
      const glyph = GLYPHS[char] ?? GLYPHS["?"]!;
      for (let row = 0; row < 5; row++) for (let col = 0; col < 3; col++) if (glyph[row]![col] === "1") this.fillRect(cursor + col * scale, y + row * scale, scale, scale, color);
      cursor += 4 * scale;
      if (cursor >= this.width) break;
    }
  }
  private pixel(x: number, y: number, color: Rgb): void {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const offset = (y * this.width + x) * 3;
    this.pixels[offset] = color[0]; this.pixels[offset + 1] = color[1]; this.pixels[offset + 2] = color[2];
  }
}

function wrap(input: string, maxChars: number, maxLines: number): string[] {
  const words = input.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const chunks = word.length > maxChars ? word.match(new RegExp(`.{1,${maxChars}}`, "g")) ?? [word] : [word];
    for (const chunk of chunks) {
      const next = line ? `${line} ${chunk}` : chunk;
      if (next.length > maxChars && line) { lines.push(line); line = chunk; } else line = next;
      if (lines.length >= maxLines) break;
    }
    if (lines.length >= maxLines) break;
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (!lines.length) lines.push("");
  return lines;
}

function encodePng(canvas: Canvas): Uint8Array {
  const stride = canvas.width * 3;
  const raw = Buffer.alloc((stride + 1) * canvas.height);
  for (let y = 0; y < canvas.height; y++) {
    const target = y * (stride + 1); raw[target] = 0;
    raw.set(canvas.pixels.subarray(y * stride, (y + 1) * stride), target + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(canvas.width, 0); ihdr.writeUInt32BE(canvas.height, 4); ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([PNG_SIGNATURE, pngChunk("IHDR", ihdr), pngChunk("IDAT", deflateSync(raw, { level: 9 })), pngChunk("IEND", Buffer.alloc(0))]);
}
function pngChunk(type: string, data: Uint8Array): Buffer {
  const typeBytes = Buffer.from(type, "ascii"), body = Buffer.from(data), out = Buffer.alloc(12 + body.length);
  out.writeUInt32BE(body.length, 0); typeBytes.copy(out, 4); body.copy(out, 8); out.writeUInt32BE(crc32(Buffer.concat([typeBytes, body])), 8 + body.length); return out;
}
function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1)); }
  return (crc ^ 0xffffffff) >>> 0;
}

const GLYPHS: Record<string, readonly string[]> = {
  " ":["000","000","000","000","000"],"?":["110","001","010","000","010"],".":["000","000","000","000","010"],",":["000","000","000","010","100"],"!":["010","010","010","000","010"],":":["000","010","000","010","000"],"-":["000","000","111","000","000"],"/":["001","001","010","100","100"],"&":["010","101","010","101","011"],"+":["000","010","111","010","000"],"%":["101","001","010","100","101"],"#":["101","111","101","111","101"],"'":["010","010","000","000","000"],"(":["010","100","100","100","010"],")":["010","001","001","001","010"],
  "A":["010","101","111","101","101"],"B":["110","101","110","101","110"],"C":["011","100","100","100","011"],"D":["110","101","101","101","110"],"E":["111","100","110","100","111"],"F":["111","100","110","100","100"],"G":["011","100","101","101","011"],"H":["101","101","111","101","101"],"I":["111","010","010","010","111"],"J":["001","001","001","101","010"],"K":["101","101","110","101","101"],"L":["100","100","100","100","111"],"M":["101","111","111","101","101"],"N":["101","111","111","111","101"],"O":["010","101","101","101","010"],"P":["110","101","110","100","100"],"Q":["010","101","101","111","011"],"R":["110","101","110","101","101"],"S":["011","100","010","001","110"],"T":["111","010","010","010","010"],"U":["101","101","101","101","111"],"V":["101","101","101","101","010"],"W":["101","101","111","111","101"],"X":["101","101","010","101","101"],"Y":["101","101","010","010","010"],"Z":["111","001","010","100","111"],
  "0":["111","101","101","101","111"],"1":["010","110","010","010","111"],"2":["110","001","010","100","111"],"3":["110","001","010","001","110"],"4":["101","101","111","001","001"],"5":["111","100","110","001","110"],"6":["011","100","110","101","010"],"7":["111","001","010","010","010"],"8":["010","101","010","101","010"],"9":["010","101","011","001","110"]
};
