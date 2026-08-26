import { createHash } from "node:crypto";
import {
  InMemoryNormalizedSourceCache,
  SourceRouter,
  prepareNormalizedSourceDocument,
  type NormalizedSourceCache,
  type RawSourceDocument,
  type SourceAdapter,
  type SourceIdentity,
} from "@kairo/agent-contracts";
import type { PublicBrandReference, PublicBrandReferenceReader } from "@kairo/domain/brand-brain-bootstrap";
import { PublicBrandReferenceHttpReader } from "./public-brand-reference";
import { GitHubAdapter, HackerNewsAdapter, RssSubstackAdapter, WebsiteAdapter } from "./source-adapters";

const ADAPTER_VERSION = "secure-http-v2";
const PARSER_VERSION = "public-brand-reference-v2";

export class SecureHttpSourceAdapter implements SourceAdapter {
  readonly id = "secure-http";
  readonly version = ADAPTER_VERSION;
  readonly priority = -100;
  constructor(private readonly reader: PublicBrandReferenceReader) {}
  supports(url: URL) { return url.protocol === "http:" || url.protocol === "https:"; }
  identify(url: URL) { return SourceRouter.identify(url); }
  async health() { return { status: "available" as const }; }
  async fetch(request: { url: string }) {
    const reference = await this.reader.read(request.url);
    const stableContent = JSON.stringify({ title: reference.title ?? "", summary: reference.summary ?? "", excerpt: reference.excerpt, contentType: reference.contentType ?? "" });
    return {
      canonicalUrl: reference.url,
      retrievedAt: reference.retrievedAt,
      contentHash: `sha256:${createHash("sha256").update(stableContent).digest("hex")}`,
      payload: compactReference(reference),
    } satisfies RawSourceDocument;
  }
  async normalize(raw: RawSourceDocument, identity: SourceIdentity) {
    const value = raw.payload as Record<string, unknown>;
    const title = typeof value.title === "string" ? value.title : undefined;
    const summary = typeof value.summary === "string" ? value.summary : undefined;
    const body = typeof value.excerpt === "string" ? value.excerpt : undefined;
    return prepareNormalizedSourceDocument({
      canonicalUrl: raw.canonicalUrl,
      platform: identity.platform,
      sourceType: identity.sourceType,
      ...(title ? { title } : {}),
      ...(summary ? { description: summary } : {}),
      ...(body ? { body } : {}),
      retrievedAt: raw.retrievedAt,
      contentHash: raw.contentHash,
      provider: this.id,
      providerVersion: this.version,
      parserVersion: PARSER_VERSION,
      provenance: [{ provider: this.id, providerVersion: this.version, sourceUrl: raw.canonicalUrl, retrievedAt: raw.retrievedAt }],
      confidence: body ? 1 : 0.5,
      extractionWarnings: raw.warnings ?? [],
    });
  }
}

export function createSourceIntelligenceRouter(options: { reader?: PublicBrandReferenceReader; cache?: NormalizedSourceCache } = {}) {
  const reader = options.reader ?? new PublicBrandReferenceHttpReader();
  return new SourceRouter([
    new GitHubAdapter(),
    new HackerNewsAdapter({ linkedReader: reader }),
    new RssSubstackAdapter(),
    new WebsiteAdapter({ reader }),
    new SecureHttpSourceAdapter(reader),
  ], options.cache ?? new InMemoryNormalizedSourceCache());
}

export class SourceIntelligenceBrandReferenceReader implements PublicBrandReferenceReader {
  constructor(private readonly router = createSourceIntelligenceRouter()) {}
  async read(url: string): Promise<PublicBrandReference> {
    const { document } = await this.router.fetch({ url, scope: { visibility: "global-public" }, timeoutMs: 10_000 });
    const excerpt = document.body ?? document.description ?? document.title;
    if (!excerpt) throw new Error("Public Brand reference contained no usable text");
    return {
      url: document.canonicalUrl,
      ...(document.title ? { title: document.title } : {}),
      ...(document.description ? { summary: document.description } : {}),
      excerpt,
      retrievedAt: document.retrievedAt,
    };
  }
}

function compactReference(reference: PublicBrandReference) {
  return {
    ...(reference.title ? { title: reference.title } : {}),
    ...(reference.summary ? { summary: reference.summary } : {}),
    excerpt: reference.excerpt,
    ...(reference.contentType ? { contentType: reference.contentType } : {}),
    ...(reference.sizeBytes !== undefined ? { sizeBytes: reference.sizeBytes } : {}),
    ...(reference.links?.length ? { links: reference.links } : {}),
  };
}
