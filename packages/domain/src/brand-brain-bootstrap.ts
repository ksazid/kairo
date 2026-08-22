import type {
  BrandBrainBuildResponse,
  BrandBrainSection,
  BuildBrandBrainRequest,
  GuidedBrandObjective,
  KnowledgeSourceDto,
} from "@kairo/contracts";
import { DomainValidationError, type KairoRepository } from "./index";

export interface PublicBrandReference {
  url: string;
  title?: string;
  summary?: string;
  excerpt: string;
  retrievedAt: string;
  contentType?: string;
  sizeBytes?: number;
}

export interface PublicBrandReferenceReader {
  read(url: string): Promise<PublicBrandReference>;
}

export interface BrandBrainProposal {
  section: BrandBrainSection;
  fieldKey: string;
  value: string;
  sourceIds: string[];
}

export interface BrandBrainProposalInput {
  workspaceId: string;
  brandId: string;
  brandName: string;
  primaryObjective: string;
  existingConfirmed: Record<string, string>;
  references: Array<PublicBrandReference & { sourceId: string }>;
}

export interface BrandBrainProposalGenerator {
  propose(input: BrandBrainProposalInput): Promise<BrandBrainProposal[]>;
}

const OBJECTIVE_LABELS: Record<GuidedBrandObjective, string> = {
  "grow-audience": "Grow audience",
  "build-authority": "Build authority",
  "generate-leads": "Generate leads",
  "build-community": "Build community",
  "promote-offer": "Promote an offer",
};

const PROPOSAL_FIELDS = new Map<string, BrandBrainSection>([
  ["identity.description", "identity"],
  ["identity.category", "identity"],
  ["identity.geography", "identity"],
  ["identity.language", "identity"],
  ["positioning.value-proposition", "positioning"],
  ["positioning.differentiation", "positioning"],
  ["positioning.market-position", "positioning"],
  ["audience.primary", "audience"],
  ["audience.pains", "audience"],
  ["audience.motivations", "audience"],
  ["audience.sophistication", "audience"],
  ["voice.tone", "voice"],
  ["voice.vocabulary", "voice"],
  ["voice.prohibited-wording", "voice"],
  ["voice.examples", "voice"],
  ["content.pillars", "content-strategy"],
  ["content.preferred-topics", "content-strategy"],
  ["content.channels", "content-strategy"],
  ["content.visual-direction", "content-strategy"],
  ["content.color-direction", "content-strategy"],
  ["content.typography-direction", "content-strategy"],
  ["content.imagery-direction", "content-strategy"],
  ["content.logo-guidance", "content-strategy"],
  ["boundaries.claims-to-avoid", "boundaries"],
  ["boundaries.prohibited-subjects", "boundaries"],
  ["boundaries.sensitive-subjects", "boundaries"],
]);

const SOURCE_REQUIRED_PROPOSAL_FIELDS = new Set([
  "content.visual-direction",
  "content.color-direction",
  "content.typography-direction",
  "content.imagery-direction",
  "content.logo-guidance",
]);

const VISUAL_DIRECTION_VALUE_LIMIT = 2_000;

export class BrandBrainBootstrapService {
  constructor(
    private readonly repository: KairoRepository,
    private readonly generator: BrandBrainProposalGenerator | undefined,
    private readonly referenceReader: PublicBrandReferenceReader,
  ) {}

  async build(accountId: string, brandId: string, input: BuildBrandBrainRequest): Promise<BrandBrainBuildResponse> {
    const objective = objectiveLabel(input.primaryObjective);
    const brand = await this.repository.getBrandForAccount(accountId, brandId);
    if (!brand) throw new DomainValidationError("Brand is not available for guided setup");

    const before = await this.repository.listBrandBrainFields(accountId, brandId);
    const existingByKey = new Map(before.map((field) => [field.fieldKey, field]));

    await this.repository.putConfirmedBrandBrainField(accountId, brandId, "goals.objectives", {
      section: "goals",
      value: objective,
      ...(existingByKey.get("goals.objectives") ? { expectedVersion: existingByKey.get("goals.objectives")!.version } : {}),
    });

    const ownerBoundary = optionalText(input.ownerBoundary, 4_000);
    if (ownerBoundary) {
      const existing = existingByKey.get("boundaries.owner-directive");
      await this.repository.putConfirmedBrandBrainField(accountId, brandId, "boundaries.owner-directive", {
        section: "boundaries",
        value: ownerBoundary,
        ...(existing ? { expectedVersion: existing.version } : {}),
      });
    }

    const successfulReferences = await this.readReferences(accountId, brandId, [
      brand.publicSourceUrl,
      brand.publicProfileUrl,
      optionalUrl(input.publicReferenceUrl),
    ]);
    const privateExtracts = await this.readActiveKnowledgeExtracts(accountId, brandId, new Set(successfulReferences.map((item) => item.sourceId)));
    successfulReferences.push(...privateExtracts);

    if (!this.generator) {
      return {
        brain: await this.repository.listBrandBrainFields(accountId, brandId),
        generatorStatus: "unavailable",
        proposedCount: 0,
        skippedConfirmedCount: 0,
        sourceIds: successfulReferences.map((item) => item.sourceId),
      };
    }

    const current = await this.repository.listBrandBrainFields(accountId, brandId);
    const confirmed = Object.fromEntries(current.filter((field) => field.state === "confirmed").map((field) => [field.fieldKey, field.value]));
    let proposals: BrandBrainProposal[];
    try {
      proposals = await this.generator.propose({
        workspaceId: brand.workspaceId,
        brandId: brand.id,
        brandName: brand.name,
        primaryObjective: objective,
        existingConfirmed: confirmed,
        references: successfulReferences,
      });
    } catch {
      return {
        brain: await this.repository.listBrandBrainFields(accountId, brandId),
        generatorStatus: "unavailable",
        proposedCount: 0,
        skippedConfirmedCount: 0,
        sourceIds: successfulReferences.map((item) => item.sourceId),
      };
    }

    const liveFields = new Map((await this.repository.listBrandBrainFields(accountId, brandId)).map((field) => [field.fieldKey, field]));
    const inspectedSourceIds = successfulReferences.map((item) => item.sourceId);
    const inspectedSources = new Set(inspectedSourceIds);
    let proposedCount = 0;
    let skippedConfirmedCount = 0;

    for (const proposal of proposals) {
      const section = PROPOSAL_FIELDS.get(proposal.fieldKey);
      if (!section || proposal.section !== section) throw new DomainValidationError("Brand Brain proposal is outside the guided allow-list");
      const value = proposal.value.trim();
      const valueLimit = SOURCE_REQUIRED_PROPOSAL_FIELDS.has(proposal.fieldKey) ? VISUAL_DIRECTION_VALUE_LIMIT : 10_000;
      if (!value || value.length > valueLimit) throw new DomainValidationError("Brand Brain proposal value is invalid");
      const proposalSourceIds = [...new Set(proposal.sourceIds.map((sourceId) => sourceId.trim()).filter(Boolean))];
      if (SOURCE_REQUIRED_PROPOSAL_FIELDS.has(proposal.fieldKey) && proposalSourceIds.length === 0) {
        throw new DomainValidationError("Imported visual direction requires active source provenance");
      }
      if (proposalSourceIds.some((sourceId) => !inspectedSources.has(sourceId))) {
        throw new DomainValidationError("Brand Brain proposal provenance is invalid");
      }
      const existing = liveFields.get(proposal.fieldKey);
      if (existing?.state === "confirmed") {
        skippedConfirmedCount += 1;
        continue;
      }
      const written = await this.repository.recordInferredBrandBrainField(accountId, brandId, {
        section,
        fieldKey: proposal.fieldKey,
        value,
        sourceIds: proposalSourceIds,
        ...(existing ? { expectedVersion: existing.version } : {}),
      });
      liveFields.set(proposal.fieldKey, written);
      proposedCount += 1;
    }

    return {
      brain: await this.repository.listBrandBrainFields(accountId, brandId),
      generatorStatus: "generated",
      proposedCount,
      skippedConfirmedCount,
      sourceIds: inspectedSourceIds,
    };
  }

  private async readActiveKnowledgeExtracts(
    accountId: string,
    brandId: string,
    excludedSourceIds: ReadonlySet<string>,
  ): Promise<Array<PublicBrandReference & { sourceId: string }>> {
    if (!this.repository.listActiveKnowledgeExtractsForBrandBrain) return [];
    const extracts = await this.repository.listActiveKnowledgeExtractsForBrandBrain(accountId, brandId);
    return extracts
      .filter((item) => !excludedSourceIds.has(item.sourceId) && item.excerpt.trim())
      .slice(0, 5)
      .map((item) => ({
        sourceId: item.sourceId,
        url: item.sourceUrl ?? `kairo-knowledge://${encodeURIComponent(item.sourceId)}`,
        ...(item.title ? { title: item.title } : {}),
        excerpt: item.excerpt.slice(0, 20_000),
        retrievedAt: item.updatedAt,
        ...(item.contentType ? { contentType: item.contentType } : {}),
      }));
  }

  private async readReferences(
    accountId: string,
    brandId: string,
    candidates: Array<string | undefined>,
  ): Promise<Array<PublicBrandReference & { sourceId: string }>> {
    const unique = [...new Set(candidates.filter((value): value is string => Boolean(value)).map((value) => value.trim()).filter(Boolean))];
    const existingSources = await this.repository.listKnowledgeSources(accountId, brandId);
    const result: Array<PublicBrandReference & { sourceId: string }> = [];

    for (const candidate of unique.slice(0, 3)) {
      try {
        const reference = await this.referenceReader.read(candidate);
        const source = await this.ensureSource(accountId, brandId, reference, existingSources);
        result.push({ ...reference, sourceId: source.id });
      } catch {
        // Public-reference failure is isolated. Owner-confirmed context can still bootstrap provisional suggestions.
      }
    }
    return result;
  }

  private async ensureSource(
    accountId: string,
    brandId: string,
    reference: PublicBrandReference,
    existingSources: KnowledgeSourceDto[],
  ): Promise<KnowledgeSourceDto> {
    const existing = existingSources.find((source) => source.status === "active" && source.sourceUrl === reference.url);
    if (existing) return existing;
    const isPdf = reference.contentType?.toLowerCase() === "application/pdf";
    const created = await this.repository.createKnowledgeSource(accountId, brandId, {
      type: isPdf ? "document" : "url",
      status: "active",
      title: reference.title ?? (isPdf ? "Public Brand PDF" : "Public Brand reference"),
      sourceUrl: reference.url,
      ...(reference.contentType ? { contentType: reference.contentType } : {}),
      ...(reference.sizeBytes ? { sizeBytes: reference.sizeBytes } : {}),
    });
    existingSources.push(created);
    return created;
  }
}

function objectiveLabel(value: unknown): string {
  if (typeof value !== "string" || !(value in OBJECTIVE_LABELS)) throw new DomainValidationError("primaryObjective is not supported");
  return OBJECTIVE_LABELS[value as GuidedBrandObjective];
}

function optionalText(value: unknown, maxLength: number): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") throw new DomainValidationError("ownerBoundary must be text");
  const normalized = value.trim();
  if (!normalized) return undefined;
  if (normalized.length > maxLength) throw new DomainValidationError("ownerBoundary is too long");
  return normalized;
}

function optionalUrl(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") throw new DomainValidationError("publicReferenceUrl must be a URL");
  const text = value.trim();
  if (!text) return undefined;
  try {
    const url = new URL(text);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error("unsafe");
    return url.toString();
  } catch {
    throw new DomainValidationError("publicReferenceUrl must be a valid public HTTP(S) URL");
  }
}
