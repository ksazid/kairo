import { DomainValidationError } from "./index";

export interface EvidenceReferenceInput {
  url: string;
  title?: string;
  summary?: string;
  excerpt: string;
  retrievedAt: string;
  contentType?: string;
  sizeBytes?: number;
  links?: string[];
}

export interface EvidenceProposalInput {
  fieldKey: string;
  value: string;
  sourceIds: string[];
}

export interface EvidenceProposalGateOptions {
  inspectedSourceIds: ReadonlySet<string>;
  maxValueLength: number;
  requireSource: boolean;
}

const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const ZERO_WIDTH_CHARACTERS = /[\u200B-\u200D\u2060\uFEFF]/g;
const HTML_BLOCKS = /<\s*(script|style|iframe|object|embed|template|svg)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi;
const HTML_TAGS = /<[^>]{1,512}>/g;
const UNSAFE_SCHEME = /(?:javascript|vbscript|data|file):/i;
const PROMPT_INJECTION_PATTERNS = [
  /\b(?:ignore|disregard|override|forget)\s+(?:all\s+)?(?:previous|prior|above|earlier|system|developer)\s+(?:instructions?|prompts?|messages?)\b/i,
  /\b(?:system|developer)\s+(?:prompt|message|instructions?)\s*:/i,
  /\b(?:reveal|print|return|expose)\s+(?:the\s+)?(?:system|developer)\s+(?:prompt|message|instructions?)\b/i,
  /\b(?:you are|act as)\s+(?:chatgpt|the system|an? assistant)\b/i,
  /(?:^|\n)\s*#{0,3}\s*(?:system|developer|assistant)\s*:/im,
];

const MAX_TITLE_LENGTH = 500;
const MAX_SUMMARY_LENGTH = 2_000;
const MAX_EXCERPT_LENGTH = 20_000;
const MAX_LINKS = 100;

export function sanitizeEvidenceReference<T extends EvidenceReferenceInput>(
  reference: T,
  options: { allowInternalUrl?: boolean } = {},
): T {
  const url = normalizeEvidenceUrl(reference.url, Boolean(options.allowInternalUrl));
  const excerpt = sanitizeEvidenceText(reference.excerpt, MAX_EXCERPT_LENGTH, "Evidence excerpt");
  if (!excerpt) throw new DomainValidationError("Evidence excerpt is empty after sanitization");

  const retrievedAt = new Date(reference.retrievedAt);
  if (!Number.isFinite(retrievedAt.getTime())) throw new DomainValidationError("Evidence retrieval timestamp is invalid");

  const links = reference.links
    ? [...new Set(reference.links.map((link) => normalizeEvidenceUrl(link, false)))].slice(0, MAX_LINKS)
    : undefined;

  return {
    ...reference,
    url,
    ...(reference.title !== undefined ? { title: sanitizeEvidenceText(reference.title, MAX_TITLE_LENGTH, "Evidence title") } : {}),
    ...(reference.summary !== undefined ? { summary: sanitizeEvidenceText(reference.summary, MAX_SUMMARY_LENGTH, "Evidence summary") } : {}),
    excerpt,
    retrievedAt: retrievedAt.toISOString(),
    ...(links ? { links } : {}),
  };
}

export function validateEvidenceProposal<T extends EvidenceProposalInput>(
  proposal: T,
  options: EvidenceProposalGateOptions,
): T {
  const fieldKey = sanitizeIdentifier(proposal.fieldKey, "Brand Brain field key");
  const value = sanitizeEvidenceText(proposal.value, options.maxValueLength, "Brand Brain proposal value", false);
  if (!value) throw new DomainValidationError("Brand Brain proposal value is invalid");
  if (UNSAFE_SCHEME.test(value)) throw new DomainValidationError("Brand Brain proposal contains an unsafe string");

  const sourceIds = [...new Set(proposal.sourceIds.map((sourceId) => sanitizeIdentifier(sourceId, "Brand Brain source id")).filter(Boolean))];
  if (options.requireSource && sourceIds.length === 0) {
    throw new DomainValidationError("Source-backed Brand Brain proposals require active source provenance");
  }
  if (sourceIds.some((sourceId) => !options.inspectedSourceIds.has(sourceId))) {
    throw new DomainValidationError("Brand Brain proposal provenance is invalid");
  }

  return { ...proposal, fieldKey, value, sourceIds };
}

export function deduplicateEvidenceProposals<T extends EvidenceProposalInput>(proposals: T[]): T[] {
  const byField = new Map<string, T>();
  for (const proposal of proposals) {
    const previous = byField.get(proposal.fieldKey);
    if (!previous) {
      byField.set(proposal.fieldKey, proposal);
      continue;
    }

    const sameValue = previous.value === proposal.value;
    const sameSources = [...previous.sourceIds].sort().join("\u0000") === [...proposal.sourceIds].sort().join("\u0000");
    if (!sameValue || !sameSources) {
      throw new DomainValidationError("Conflicting duplicate Brand Brain proposals are not allowed");
    }
  }
  return [...byField.values()];
}

export function sanitizeEvidenceText(value: string, maxLength: number, label: string, truncate = true): string {
  if (typeof value !== "string") throw new DomainValidationError(`${label} must be text`);
  const normalized = value
    .normalize("NFKC")
    .replace(HTML_BLOCKS, " ")
    .replace(HTML_TAGS, " ")
    .replace(CONTROL_CHARACTERS, "")
    .replace(ZERO_WIDTH_CHARACTERS, "")
    .replace(/\s+/g, " ")
    .trim();

  if (PROMPT_INJECTION_PATTERNS.some((pattern) => pattern.test(normalized))) {
    throw new DomainValidationError(`${label} contains prompt-injection-style instructions`);
  }
  if (normalized.length > maxLength) {
    if (!truncate) throw new DomainValidationError(`${label} is too long`);
    return normalized.slice(0, maxLength).trim();
  }
  return normalized;
}

function normalizeEvidenceUrl(value: string, allowInternal: boolean): string {
  if (typeof value !== "string" || !value.trim()) throw new DomainValidationError("Evidence URL is invalid");
  const text = value.trim();
  if (UNSAFE_SCHEME.test(text)) throw new DomainValidationError("Evidence URL uses an unsafe scheme");

  try {
    const url = new URL(text);
    const allowedProtocols = allowInternal ? ["http:", "https:", "kairo-knowledge:"] : ["http:", "https:"];
    if (!allowedProtocols.includes(url.protocol) || url.username || url.password) throw new Error("unsafe");
    return url.toString();
  } catch {
    throw new DomainValidationError("Evidence URL must use an allowed scheme");
  }
}

function sanitizeIdentifier(value: string, label: string): string {
  if (typeof value !== "string") throw new DomainValidationError(`${label} must be text`);
  const normalized = value.replace(CONTROL_CHARACTERS, "").replace(ZERO_WIDTH_CHARACTERS, "").trim();
  if (!normalized || normalized.length > 256 || /[<>\r\n]/.test(normalized)) {
    throw new DomainValidationError(`${label} is invalid`);
  }
  return normalized;
}
