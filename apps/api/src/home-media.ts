import { randomUUID } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import { DomainValidationError, ResourceNotFoundError } from "@kairo/domain";
import {
  privateMediaObjectKey,
  S3PrivateUploadSigner,
  S3TemporaryObjectSigner,
} from "./private-object-storage";

export type HomeMediaKind = "image" | "video";

export interface HomeMediaAssetView {
  id: string;
  name: string;
  kind: HomeMediaKind;
  mimeType: string;
  sizeBytes: number;
  previewUrl: string;
  createdAt: string;
}

export interface BeginHomeMediaUploadInput {
  name: string;
  mimeType: string;
  sizeBytes: number;
}

export interface HomeMediaReference {
  id: string;
  name: string;
  kind: HomeMediaKind;
  mimeType: string;
  sizeBytes: number;
}

interface PendingUpload {
  id: string;
  accountId: string;
  workspaceId: string;
  brandId: string;
  objectKey: string;
  fileName: string;
  kind: HomeMediaKind;
  mimeType: string;
  sizeBytes: number;
  expiresAt: string;
  createdAt: string;
}

interface CompletedUpload extends PendingUpload {
  completedAt?: string;
}

export interface HomeMediaRepository {
  createPending(value: PendingUpload): Promise<void>;
  getPendingForCompletion(accountId: string, brandId: string, uploadId: string): Promise<PendingUpload | null>;
  complete(upload: PendingUpload, completedAt: string): Promise<CompletedUpload>;
  list(accountId: string, brandId: string): Promise<CompletedUpload[]>;
  requireAssets(accountId: string, brandId: string, ids: string[]): Promise<HomeMediaReference[]>;
}

const IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const VIDEO_MIME = new Set(["video/mp4", "video/quicktime", "video/webm"]);
const IMAGE_MAX_BYTES = 25 * 1024 * 1024;
const VIDEO_MAX_BYTES = 512 * 1024 * 1024;
const SIGNED_URL_SECONDS = 600;
const MAX_CREATION_MEDIA = 12;

export class PgHomeMediaRepository implements HomeMediaRepository {
  constructor(private pool: Pool) {}

  async createPending(value: PendingUpload) {
    await this.pool.query(
      `insert into home_media_uploads(
        id,account_id,workspace_id,brand_id,object_key,file_name,kind,mime_type,size_bytes,status,expires_at,created_at
      ) values($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending',$10,$11)`,
      [
        value.id,
        value.accountId,
        value.workspaceId,
        value.brandId,
        value.objectKey,
        value.fileName,
        value.kind,
        value.mimeType,
        value.sizeBytes,
        value.expiresAt,
        value.createdAt,
      ],
    );
  }

  async getPendingForCompletion(accountId: string, brandId: string, uploadId: string) {
    const result = await this.pool.query(
      `select u.*
       from home_media_uploads u
       join workspace_memberships m on m.workspace_id=u.workspace_id and m.account_id=$1 and m.active=true
       where u.id=$2 and u.brand_id=$3 and u.account_id=$1 and u.status='pending'`,
      [accountId, uploadId, brandId],
    );
    return result.rows[0] ? mapPending(result.rows[0]) : null;
  }

  async complete(upload: PendingUpload, completedAt: string) {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const libraryId = await ensureKairoMediaLibrary(client, upload.workspaceId, upload.brandId, completedAt);
      await client.query(
        `insert into content_library_assets(
          id,workspace_id,brand_id,library_id,external_id,name,kind,mime_type,size_bytes,modified_at,provider_ref,preview_ref,indexed_at
        ) values($1,$2,$3,$4,$1,$5,$6,$7,$8,$9,$10,null,$9)
        on conflict(id) do nothing`,
        [
          upload.id,
          upload.workspaceId,
          upload.brandId,
          libraryId,
          upload.fileName,
          upload.kind,
          upload.mimeType,
          upload.sizeBytes,
          completedAt,
          upload.objectKey,
        ],
      );
      const updated = await client.query(
        `update home_media_uploads
         set status='completed',completed_at=$4,library_asset_id=$1
         where id=$1 and workspace_id=$2 and brand_id=$3 and status='pending'
         returning *`,
        [upload.id, upload.workspaceId, upload.brandId, completedAt],
      );
      if (!updated.rows[0]) throw new Error("Media upload completion changed concurrently");
      await client.query("commit");
      return mapCompleted(updated.rows[0]);
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async list(accountId: string, brandId: string) {
    const result = await this.pool.query(
      `select u.*
       from home_media_uploads u
       join workspace_memberships m on m.workspace_id=u.workspace_id and m.account_id=$1 and m.active=true
       where u.brand_id=$2 and u.status='completed'
       order by u.completed_at desc nulls last,u.created_at desc`,
      [accountId, brandId],
    );
    return result.rows.map(mapCompleted);
  }

  async requireAssets(accountId: string, brandId: string, ids: string[]): Promise<HomeMediaReference[]> {
    const normalized = normalizeIds(ids);
    if (!normalized.length) return [];
    const result = await this.pool.query(
      `select u.*
       from home_media_uploads u
       join workspace_memberships m on m.workspace_id=u.workspace_id and m.account_id=$1 and m.active=true
       where u.brand_id=$2 and u.status='completed' and u.id=any($3::text[])`,
      [accountId, brandId, normalized],
    );
    const byId = new Map(result.rows.map((row) => [String(row.id), mapCompleted(row)]));
    if (byId.size !== normalized.length) throw new ResourceNotFoundError("One or more media assets are unavailable for this Brand");
    return normalized.map((id) => {
      const item = byId.get(id)!;
      return { id: item.id, name: item.fileName, kind: item.kind, mimeType: item.mimeType, sizeBytes: item.sizeBytes };
    });
  }
}

export class HomeMediaService {
  constructor(
    private repository: HomeMediaRepository,
    private uploadSigner: S3PrivateUploadSigner,
    private deliverySigner: S3TemporaryObjectSigner,
    private storageProvider: string,
    private fetcher: typeof fetch = fetch,
    private now: () => Date = () => new Date(),
  ) {}

  async begin(accountId: string, workspaceId: string, brandId: string, raw: BeginHomeMediaUploadInput) {
    const input = validateUpload(raw);
    const id = randomUUID();
    const createdAt = this.now();
    const expiresAt = new Date(createdAt.getTime() + SIGNED_URL_SECONDS * 1000);
    const objectKey = privateMediaObjectKey(workspaceId, brandId, id);
    const value: PendingUpload = {
      id,
      accountId,
      workspaceId,
      brandId,
      objectKey,
      fileName: input.name,
      kind: input.kind,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      expiresAt: expiresAt.toISOString(),
      createdAt: createdAt.toISOString(),
    };
    await this.repository.createPending(value);
    const uploadUrl = await this.uploadSigner.signPut({
      objectKey,
      contentType: input.mimeType,
      expiresInSeconds: SIGNED_URL_SECONDS,
    });
    return {
      uploadId: id,
      uploadUrl,
      expiresInSeconds: SIGNED_URL_SECONDS,
      headers: { "content-type": input.mimeType },
    };
  }

  async complete(accountId: string, brandId: string, uploadId: string) {
    const id = identifier(uploadId, "uploadId");
    const pending = await this.repository.getPendingForCompletion(accountId, brandId, id);
    if (!pending) throw new ResourceNotFoundError("Media upload was not found");
    const now = this.now();
    if (new Date(pending.expiresAt).getTime() < now.getTime()) throw new DomainValidationError("Media upload has expired. Upload the file again.");

    await this.verifyObject(pending);
    const completed = await this.repository.complete(pending, now.toISOString());
    return this.toView(completed);
  }

  async list(accountId: string, brandId: string): Promise<HomeMediaAssetView[]> {
    const items = await this.repository.list(accountId, brandId);
    return Promise.all(items.map((item) => this.toView(item)));
  }

  private async verifyObject(upload: PendingUpload) {
    const previewUrl = await this.deliverySigner.sign({
      storageProvider: this.storageProvider,
      objectKey: upload.objectKey,
      expiresInSeconds: 120,
    });
    const response = await this.fetcher(previewUrl, { headers: { range: "bytes=0-0" } });
    try {
      if (!(response.ok || response.status === 206)) throw new DomainValidationError("Uploaded media could not be verified");
      const contentType = (response.headers.get("content-type") ?? "").split(";", 1)[0]!.trim().toLowerCase();
      if (contentType !== upload.mimeType) throw new DomainValidationError("Uploaded media type does not match the requested file type");
      const actualSize = sizeFromHeaders(response.headers);
      if (actualSize !== undefined && actualSize !== upload.sizeBytes) throw new DomainValidationError("Uploaded media size does not match the requested file size");
    } finally {
      await response.body?.cancel().catch(() => undefined);
    }
  }

  private async toView(item: CompletedUpload): Promise<HomeMediaAssetView> {
    const previewUrl = await this.deliverySigner.sign({
      storageProvider: this.storageProvider,
      objectKey: item.objectKey,
      expiresInSeconds: SIGNED_URL_SECONDS,
    });
    return {
      id: item.id,
      name: item.fileName,
      kind: item.kind,
      mimeType: item.mimeType,
      sizeBytes: item.sizeBytes,
      previewUrl,
      createdAt: item.completedAt ?? item.createdAt,
    };
  }
}

async function ensureKairoMediaLibrary(client: PoolClient, workspaceId: string, brandId: string, at: string) {
  const existing = await client.query(
    `select id from content_asset_libraries where workspace_id=$1 and brand_id=$2 and lower(name)='kairo media' limit 1`,
    [workspaceId, brandId],
  );
  if (existing.rows[0]) return String(existing.rows[0].id);
  const id = `kairo-media-${brandId}`;
  await client.query(
    `insert into content_asset_libraries(id,workspace_id,brand_id,name,provider,status,provider_label,created_at,updated_at)
     values($1,$2,$3,'Kairo Media','manual','connected','Private media',$4,$4)
     on conflict do nothing`,
    [id, workspaceId, brandId, at],
  );
  const resolved = await client.query(
    `select id from content_asset_libraries where workspace_id=$1 and brand_id=$2 and lower(name)='kairo media' limit 1`,
    [workspaceId, brandId],
  );
  if (!resolved.rows[0]) throw new Error("Unable to create Kairo Media library");
  return String(resolved.rows[0].id);
}

function validateUpload(raw: BeginHomeMediaUploadInput) {
  const name = typeof raw?.name === "string" ? raw.name.trim() : "";
  if (!name || name.length > 240) throw new DomainValidationError("Media file name must be between 1 and 240 characters");
  const mimeType = typeof raw?.mimeType === "string" ? raw.mimeType.trim().toLowerCase() : "";
  const sizeBytes = Number(raw?.sizeBytes);
  if (!Number.isSafeInteger(sizeBytes) || sizeBytes <= 0) throw new DomainValidationError("Media file size is invalid");
  if (IMAGE_MIME.has(mimeType)) {
    if (sizeBytes > IMAGE_MAX_BYTES) throw new DomainValidationError("Image must be 25 MiB or smaller");
    return { name, mimeType, sizeBytes, kind: "image" as const };
  }
  if (VIDEO_MIME.has(mimeType)) {
    if (sizeBytes > VIDEO_MAX_BYTES) throw new DomainValidationError("Video must be 512 MiB or smaller");
    return { name, mimeType, sizeBytes, kind: "video" as const };
  }
  throw new DomainValidationError("Unsupported media type. Use JPEG, PNG, WebP, MP4, MOV, or WebM.");
}

function normalizeIds(input: string[]) {
  if (!Array.isArray(input)) throw new DomainValidationError("mediaAssetIds must be an array");
  const unique = [...new Set(input.map((value) => identifier(value, "mediaAssetId")))];
  if (unique.length > MAX_CREATION_MEDIA) throw new DomainValidationError(`A creation can use at most ${MAX_CREATION_MEDIA} media assets`);
  return unique;
}

function identifier(value: unknown, field: string) {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (!normalized || normalized.length > 200 || !/^[A-Za-z0-9._-]+$/.test(normalized)) throw new DomainValidationError(`${field} is invalid`);
  return normalized;
}

function sizeFromHeaders(headers: Headers) {
  const contentRange = headers.get("content-range");
  const match = contentRange?.match(/\/(\d+)$/);
  if (match) return Number(match[1]);
  const contentLength = headers.get("content-length");
  if (contentLength && /^\d+$/.test(contentLength)) return Number(contentLength);
  return undefined;
}

function mapPending(row: any): PendingUpload {
  return {
    id: String(row.id),
    accountId: String(row.account_id),
    workspaceId: String(row.workspace_id),
    brandId: String(row.brand_id),
    objectKey: String(row.object_key),
    fileName: String(row.file_name),
    kind: row.kind,
    mimeType: String(row.mime_type),
    sizeBytes: Number(row.size_bytes),
    expiresAt: new Date(row.expires_at).toISOString(),
    createdAt: new Date(row.created_at).toISOString(),
  };
}

function mapCompleted(row: any): CompletedUpload {
  return {
    ...mapPending(row),
    completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : undefined,
  };
}
