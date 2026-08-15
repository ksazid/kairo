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
  ["boundaries.claims-to-avoid", "boundaries"],
  ["boundaries.prohibited-subjects", "boundaries"],
  ["boundaries.sensitive-subjects", "boundaries"],
]);

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

    if (!this.generator || successfulReferences.length === 0) {
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
      if (!value || value.length > 10_000) throw new DomainValidationError("Brand Brain proposal value is invalid");
      const proposalSourceIds = [...new Set(proposal.sourceIds.map((sourceId) => sourceId.trim()).filter(Boolean))];
      if (!proposalSourceIds.length || proposalSourceIds.some((sourceId) => !inspectedSources.has(sourceId))) {
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
        // Public-reference failure is isolated. Guided setup remains usable and never claims the source was inspected.
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
    const created = await this.repository.createKnowledgeSource(accountId, brandId, {
      type: "url",
      status: "active",
      title: reference.title ?? "Public Brand reference",
      sourceUrl: reference.url,
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
