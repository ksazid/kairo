import { lookup } from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import { isIP } from "node:net";
import type { PublicBrandReference, PublicBrandReferenceReader } from "@kairo/domain/brand-brain-bootstrap";

export type PublicBrandReferenceFailureKind =
  | "unsafe-target"
  | "unavailable"
  | "timeout"
  | "too-large"
  | "unsupported-content"
  | "invalid-response";

export class PublicBrandReferenceError extends Error {
  readonly code = "public_brand_reference_error";
  constructor(readonly kind: PublicBrandReferenceFailureKind, message: string) {
    super(message);
    this.name = "PublicBrandReferenceError";
  }
}

export interface ResolvedAddress { address: string; family: 4 | 6 }
export interface PublicBrandReferenceTransportRequest {
  url: URL;
  address: string;
  family: 4 | 6;
  timeoutMs: number;
  maxBytes: number;
}
export interface PublicBrandReferenceTransportResponse {
  status: number;
  headers: Record<string, string | undefined>;
  body: string;
}

type ResolveHost = (hostname: string) => Promise<ResolvedAddress[]>;
type Transport = (request: PublicBrandReferenceTransportRequest) => Promise<PublicBrandReferenceTransportResponse>;

export interface PublicBrandReferenceHttpReaderOptions {
  resolveHost?: ResolveHost;
  transport?: Transport;
  now?: () => Date;
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
}

export class PublicBrandReferenceHttpReader implements PublicBrandReferenceReader {
  private readonly resolveHost: ResolveHost;
  private readonly transport: Transport;
  private readonly now: () => Date;
  private readonly timeoutMs: number;
  private readonly maxBytes: number;
  private readonly maxRedirects: number;

  constructor(options: PublicBrandReferenceHttpReaderOptions = {}) {
    this.resolveHost = options.resolveHost ?? resolvePublicHost;
    this.transport = options.transport ?? nodeTransport;
    this.now = options.now ?? (() => new Date());
    this.timeoutMs = boundedInteger(options.timeoutMs ?? 7_000, 500, 20_000, "timeoutMs");
    this.maxBytes = boundedInteger(options.maxBytes ?? 256_000, 8_000, 1_000_000, "maxBytes");
    this.maxRedirects = boundedInteger(options.maxRedirects ?? 2, 0, 5, "maxRedirects");
  }

  async read(input: string): Promise<PublicBrandReference> {
    return this.readUrl(normalizeUrl(input), 0);
  }

  private async readUrl(url: URL, redirects: number): Promise<PublicBrandReference> {
    const target = await resolveSafeTarget(url, this.resolveHost);
    let response: PublicBrandReferenceTransportResponse;
    try {
      response = await this.transport({
        url,
        address: target.address,
        family: target.family,
        timeoutMs: this.timeoutMs,
        maxBytes: this.maxBytes,
      });
    } catch (error) {
      if (error instanceof PublicBrandReferenceError) throw error;
      throw new PublicBrandReferenceError("unavailable", "Public Brand reference could not be fetched");
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.location;
      if (!location) throw new PublicBrandReferenceError("invalid-response", "Public Brand reference redirect has no location");
      if (redirects >= this.maxRedirects) throw new PublicBrandReferenceError("invalid-response", "Public Brand reference exceeded the redirect limit");
      const next = normalizeUrl(new URL(location, url).toString());
      return this.readUrl(next, redirects + 1);
    }
    if (response.status < 200 || response.status >= 300) {
      throw new PublicBrandReferenceError("unavailable", `Public Brand reference returned ${response.status}`);
    }
    if (Buffer.byteLength(response.body, "utf8") > this.maxBytes) throw new PublicBrandReferenceError("too-large", "Public Brand reference exceeded the response limit");

    const contentType = (response.headers["content-type"] ?? "").toLowerCase();
    if (contentType && !contentType.includes("text/html") && !contentType.includes("text/plain")) {
      throw new PublicBrandReferenceError("unsupported-content", "Public Brand reference must be HTML or plain text");
    }

    const context = contentType.includes("text/plain")
      ? { excerpt: normalizeWhitespace(response.body).slice(0, 12_000) }
      : extractHtmlContext(response.body);
    if (!context.excerpt) throw new PublicBrandReferenceError("invalid-response", "Public Brand reference contained no usable text");

    return {
      url: url.toString(),
      ...(context.title ? { title: context.title } : {}),
      ...(context.summary ? { summary: context.summary } : {}),
      excerpt: context.excerpt,
      retrievedAt: this.now().toISOString(),
    };
  }
}

async function resolveSafeTarget(url: URL, resolver: ResolveHost): Promise<ResolvedAddress> {
  const hostname = stripBrackets(url.hostname).toLowerCase();
  if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
    throw new PublicBrandReferenceError("unsafe-target", "Public Brand reference must use a public host");
  }

  const literalFamily = isIP(hostname);
  if (literalFamily) {
    if (!isPublicAddress(hostname, literalFamily as 4 | 6)) throw new PublicBrandReferenceError("unsafe-target", "Public Brand reference resolved to a non-public address");
    return { address: hostname, family: literalFamily as 4 | 6 };
  }

  let addresses: ResolvedAddress[];
  try { addresses = await resolver(hostname); }
  catch { throw new PublicBrandReferenceError("unavailable", "Public Brand reference hostname could not be resolved"); }
  if (!addresses.length || addresses.some((entry) => !isPublicAddress(entry.address, entry.family))) {
    throw new PublicBrandReferenceError("unsafe-target", "Public Brand reference resolved to a non-public address");
  }
  return addresses[0]!;
}

async function resolvePublicHost(hostname: string): Promise<ResolvedAddress[]> {
  const entries = await lookup(hostname, { all: true, verbatim: true });
  return entries
    .filter((entry): entry is typeof entry & { family: 4 | 6 } => entry.family === 4 || entry.family === 6)
    .map((entry) => ({ address: entry.address, family: entry.family }));
}

function nodeTransport(request: PublicBrandReferenceTransportRequest): Promise<PublicBrandReferenceTransportResponse> {
  return new Promise((resolve, reject) => {
    const client = request.url.protocol === "https:" ? https : http;
    const headers = {
      accept: "text/html, text/plain;q=0.9",
      "user-agent": "KairoBrandReference/1.0",
      host: request.url.host,
    };
    const options: https.RequestOptions = {
      protocol: request.url.protocol,
      hostname: request.address,
      family: request.family,
      port: request.url.port || undefined,
      path: `${request.url.pathname}${request.url.search}`,
      method: "GET",
      headers,
      ...(request.url.protocol === "https:" ? { servername: request.url.hostname } : {}),
    };
    const outgoing = client.request(options, (incoming) => {
      const chunks: Buffer[] = [];
      let size = 0;
      incoming.on("data", (chunk: Buffer | string) => {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        size += buffer.length;
        if (size > request.maxBytes) {
          incoming.destroy(new PublicBrandReferenceError("too-large", "Public Brand reference exceeded the response limit"));
          return;
        }
        chunks.push(buffer);
      });
      incoming.on("end", () => resolve({
        status: incoming.statusCode ?? 0,
        headers: Object.fromEntries(Object.entries(incoming.headers).map(([key, value]) => [key.toLowerCase(), Array.isArray(value) ? value[0] : value])),
        body: Buffer.concat(chunks).toString("utf8"),
      }));
      incoming.on("error", reject);
    });
    outgoing.setTimeout(request.timeoutMs, () => outgoing.destroy(new PublicBrandReferenceError("timeout", "Public Brand reference timed out")));
    outgoing.on("error", reject);
    outgoing.end();
  });
}

function normalizeUrl(input: string): URL {
  let url: URL;
  try { url = new URL(input.trim()); }
  catch { throw new PublicBrandReferenceError("unsafe-target", "Public Brand reference must be a valid HTTP(S) URL"); }
  if ((url.protocol !== "http:" && url.protocol !== "https:") || url.username || url.password) {
    throw new PublicBrandReferenceError("unsafe-target", "Public Brand reference must be a credential-free HTTP(S) URL");
  }
  return url;
}

function isPublicAddress(address: string, family: 4 | 6): boolean {
  if (family === 4) {
    const parts = address.split(".").map(Number);
    if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
    const [a = 0, b = 0] = parts;
    return !(
      a === 0 || a === 10 || a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 0) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }
  const normalized = stripBrackets(address).toLowerCase();
  if (normalized === "::" || normalized === "::1") return false;
  if (normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb")) return false;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return false;
  if (normalized.startsWith("ff")) return false;
  if (normalized.startsWith("::ffff:")) {
    const embedded = normalized.slice("::ffff:".length);
    return isIP(embedded) === 4 && isPublicAddress(embedded, 4);
  }
  return isIP(normalized) === 6;
}

function extractHtmlContext(html: string): { title?: string; summary?: string; excerpt: string } {
  const withoutNoise = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ");
  const title = decodeEntities(firstMatch(withoutNoise, /<title\b[^>]*>([\s\S]*?)<\/title>/i)).trim().slice(0, 300) || undefined;
  const summary = metaDescription(withoutNoise)?.slice(0, 1_000);
  const excerpt = normalizeWhitespace(decodeEntities(withoutNoise.replace(/<[^>]+>/g, " "))).slice(0, 12_000);
  return { ...(title ? { title } : {}), ...(summary ? { summary } : {}), excerpt };
}

function metaDescription(html: string): string | undefined {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const name = attribute(tag, "name")?.toLowerCase();
    const property = attribute(tag, "property")?.toLowerCase();
    if (name !== "description" && property !== "og:description") continue;
    const content = attribute(tag, "content");
    if (content) return normalizeWhitespace(decodeEntities(content));
  }
  return undefined;
}

function attribute(tag: string, name: string): string | undefined {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = tag.match(new RegExp(`\\b${escaped}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return match?.[1] ?? match?.[2] ?? match?.[3];
}

function firstMatch(value: string, pattern: RegExp): string { return value.match(pattern)?.[1] ?? ""; }
function normalizeWhitespace(value: string): string { return value.replace(/\s+/g, " ").trim(); }
function stripBrackets(value: string): string { return value.replace(/^\[|\]$/g, ""); }
function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code: string) => String.fromCodePoint(Number.parseInt(code, 16)));
}
function boundedInteger(value: number, min: number, max: number, field: string): number {
  if (!Number.isInteger(value) || value < min || value > max) throw new Error(`${field} is out of bounds`);
  return value;
}
