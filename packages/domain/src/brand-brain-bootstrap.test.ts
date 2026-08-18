import { describe, expect, it } from "vitest";
import type {
  AccountDto,
  BrandBrainFieldDto,
  BrandDto,
  CreateWorkspaceWithBrandRequest,
  CreateWorkspaceWithBrandResponse,
  ExternalIdentity,
  KnowledgeSourceDto,
  PutBrandBrainFieldRequest,
  WorkspaceDto,
} from "@kairo/contracts";
import type {
  KairoRepository,
  PreparedKnowledgeSourceInput,
  RecordInferredBrandBrainFieldInput,
} from "./index";
import {
  BrandBrainBootstrapService,
  type BrandBrainProposalGenerator,
  type PublicBrandReferenceReader,
} from "./brand-brain-bootstrap";

const NOW = "2026-08-15T18:23:00.000Z";

class FakeRepository implements KairoRepository {
  account: AccountDto = { id: "account-1" };
  brand: BrandDto = {
    id: "brand-1",
    workspaceId: "workspace-1",
    name: "The Duke 390",
    publicProfileUrl: "https://www.instagram.com/_dukeman390/",
  };
  fields: BrandBrainFieldDto[] = [];
  sources: KnowledgeSourceDto[] = [];

  resolveAccount(_identity: ExternalIdentity): Promise<AccountDto> { return Promise.resolve(this.account); }
  createWorkspaceWithBrand(_accountId: string, _input: CreateWorkspaceWithBrandRequest): Promise<CreateWorkspaceWithBrandResponse> { throw new Error("unused"); }
  listWorkspacesForAccount(): Promise<WorkspaceDto[]> { return Promise.resolve([]); }
  hasWorkspaceAccess(): Promise<boolean> { return Promise.resolve(true); }
  listBrandsForAccount(): Promise<BrandDto[]> { return Promise.resolve([this.brand]); }
  getBrandForAccount(): Promise<BrandDto | null> { return Promise.resolve(this.brand); }
  listBrandBrainFields(): Promise<BrandBrainFieldDto[]> { return Promise.resolve(this.fields.map((field) => ({ ...field, sourceIds: [...field.sourceIds] }))); }
  putConfirmedBrandBrainField(accountId: string, _brandId: string, fieldKey: string, input: PutBrandBrainFieldRequest): Promise<BrandBrainFieldDto> {
    const existing = this.fields.find((field) => field.fieldKey === fieldKey);
    const field: BrandBrainFieldDto = {
      id: existing?.id ?? `field-${this.fields.length + 1}`,
      workspaceId: this.brand.workspaceId,
      brandId: this.brand.id,
      section: input.section,
      fieldKey,
      value: input.value,
      state: "confirmed",
      sourceIds: [],
      version: (existing?.version ?? 0) + 1,
      updatedAt: NOW,
      confirmedByAccountId: accountId,
    };
    this.fields = [...this.fields.filter((item) => item.fieldKey !== fieldKey), field];
    return Promise.resolve(field);
  }
  recordInferredBrandBrainField(_accountId: string, _brandId: string, input: RecordInferredBrandBrainFieldInput): Promise<BrandBrainFieldDto> {
    const existing = this.fields.find((field) => field.fieldKey === input.fieldKey);
    if (existing?.state === "confirmed") return Promise.resolve(existing);
    const field: BrandBrainFieldDto = {
      id: existing?.id ?? `field-${this.fields.length + 1}`,
      workspaceId: this.brand.workspaceId,
      brandId: this.brand.id,
      section: input.section,
      fieldKey: input.fieldKey,
      value: input.value,
      state: "inferred",
      sourceIds: [...input.sourceIds],
      version: (existing?.version ?? 0) + 1,
      updatedAt: NOW,
    };
    this.fields = [...this.fields.filter((item) => item.fieldKey !== input.fieldKey), field];
    return Promise.resolve(field);
  }
  listKnowledgeSources(): Promise<KnowledgeSourceDto[]> { return Promise.resolve(this.sources.map((source) => ({ ...source }))); }
  createKnowledgeSource(_accountId: string, _brandId: string, input: PreparedKnowledgeSourceInput): Promise<KnowledgeSourceDto> {
    const source: KnowledgeSourceDto = {
      id: `source-${this.sources.length + 1}`,
      workspaceId: this.brand.workspaceId,
      brandId: this.brand.id,
      type: input.type,
      status: input.status,
      ...(input.title ? { title: input.title } : {}),
      ...(input.sourceUrl ? { sourceUrl: input.sourceUrl } : {}),
      ...(input.contentType ? { contentType: input.contentType } : {}),
      ...(input.sizeBytes ? { sizeBytes: input.sizeBytes } : {}),
      hasPrivateContent: Boolean(input.rawContent),
      createdAt: NOW,
      updatedAt: NOW,
    };
    this.sources.push(source);
    return Promise.resolve(source);
  }
  setKnowledgeSourceStatus(): Promise<KnowledgeSourceDto> { throw new Error("unused"); }
  removeKnowledgeSource(): Promise<KnowledgeSourceDto> { throw new Error("unused"); }
}

class FakeReferenceReader implements PublicBrandReferenceReader {
  calls: string[] = [];
  async read(url: string) {
    this.calls.push(url);
    return {
      url,
      title: "The Duke 390",
      summary: "Duke 390 riding, ownership and motorcycle content.",
      excerpt: "Duke 390 rides, ownership notes, modifications and rider questions.",
      retrievedAt: NOW,
    };
  }
}

class FakeGenerator implements BrandBrainProposalGenerator {
  calls = 0;
  async propose() {
    this.calls += 1;
    return [
      { section: "positioning" as const, fieldKey: "positioning.market-position", value: "Rider-first Duke 390 media focused on useful ownership and riding insight.", sourceIds: ["source-1"] },
      { section: "audience" as const, fieldKey: "audience.primary", value: "Duke 390 owners, prospective owners and performance-bike enthusiasts.", sourceIds: ["source-1"] },
      { section: "boundaries" as const, fieldKey: "boundaries.sensitive-subjects", value: "Safety-critical modifications and risky public-road riding require extra care.", sourceIds: ["source-1"] },
    ];
  }
}

describe("BrandBrainBootstrapService", () => {
  it("records owner objective/directive as confirmed and generated strategy as source-backed inferred context", async () => {
    const repository = new FakeRepository();
    const reader = new FakeReferenceReader();
    const generator = new FakeGenerator();
    const service = new BrandBrainBootstrapService(repository, generator, reader);

    const result = await service.build("account-1", "brand-1", {
      primaryObjective: "grow-audience",
      ownerBoundary: "Do not present dangerous street riding as something to imitate.",
    });

    expect(result.generatorStatus).toBe("generated");
    expect(result.proposedCount).toBe(3);
    expect(reader.calls).toEqual(["https://www.instagram.com/_dukeman390/"]);

    const goal = repository.fields.find((field) => field.fieldKey === "goals.objectives");
    expect(goal).toMatchObject({ state: "confirmed", value: "Grow audience" });
    const directive = repository.fields.find((field) => field.fieldKey === "boundaries.owner-directive");
    expect(directive).toMatchObject({ state: "confirmed" });

    const audience = repository.fields.find((field) => field.fieldKey === "audience.primary");
    expect(audience?.state).toBe("inferred");
    expect(audience?.sourceIds).toEqual(["source-1"]);
  });

  it("generates provisional inferred suggestions from owner context when every public reference is unreadable", async () => {
    const repository = new FakeRepository();
    let generatorInput: Parameters<BrandBrainProposalGenerator["propose"]>[0] | undefined;
    const reader: PublicBrandReferenceReader = { read: async () => { throw new Error("provider blocked public page"); } };
    const generator: BrandBrainProposalGenerator = {
      propose: async (input) => {
        generatorInput = input;
        return [{
          section: "positioning",
          fieldKey: "positioning.market-position",
          value: "A provisional motorcycle content Brand oriented around the owner's audience-growth objective.",
          sourceIds: [],
        }];
      },
    };
    const service = new BrandBrainBootstrapService(repository, generator, reader);

    const result = await service.build("account-1", "brand-1", {
      primaryObjective: "grow-audience",
      ownerBoundary: "Never glorify dangerous public-road riding.",
    });

    expect(generatorInput?.references).toEqual([]);
    expect(generatorInput?.existingConfirmed).toMatchObject({
      "goals.objectives": "Grow audience",
      "boundaries.owner-directive": "Never glorify dangerous public-road riding.",
    });
    expect(result).toMatchObject({ generatorStatus: "generated", proposedCount: 1, sourceIds: [] });
    expect(repository.fields.find((field) => field.fieldKey === "positioning.market-position")).toMatchObject({
      state: "inferred",
      sourceIds: [],
    });
  });

  it("never replaces an existing confirmed field with an inferred proposal", async () => {
    const repository = new FakeRepository();
    repository.fields.push({
      id: "field-existing",
      workspaceId: "workspace-1",
      brandId: "brand-1",
      section: "audience",
      fieldKey: "audience.primary",
      value: "Confirmed owner audience",
      state: "confirmed",
      sourceIds: [],
      version: 2,
      updatedAt: NOW,
      confirmedByAccountId: "account-1",
    });
    const service = new BrandBrainBootstrapService(repository, new FakeGenerator(), new FakeReferenceReader());

    const result = await service.build("account-1", "brand-1", { primaryObjective: "build-authority" });

    expect(repository.fields.find((field) => field.fieldKey === "audience.primary")?.value).toBe("Confirmed owner audience");
    expect(result.skippedConfirmedCount).toBe(1);
  });

  it("rejects proposal provenance that does not belong to the inspected Brand references", async () => {
    const repository = new FakeRepository();
    const generator: BrandBrainProposalGenerator = {
      propose: async () => [{ section: "audience", fieldKey: "audience.primary", value: "Unsupported audience", sourceIds: ["foreign-source"] }],
    };
    const service = new BrandBrainBootstrapService(repository, generator, new FakeReferenceReader());

    await expect(service.build("account-1", "brand-1", { primaryObjective: "grow-audience" })).rejects.toThrow(/provenance/i);
  });

  it("can save owner intent without inventing inferred fields when no generator is configured", async () => {
    const repository = new FakeRepository();
    const service = new BrandBrainBootstrapService(repository, undefined, new FakeReferenceReader());

    const result = await service.build("account-1", "brand-1", { primaryObjective: "build-community" });

    expect(result.generatorStatus).toBe("unavailable");
    expect(result.proposedCount).toBe(0);
    expect(repository.fields.find((field) => field.fieldKey === "goals.objectives")?.state).toBe("confirmed");
  });

  it("uses an explicit setup reference when the Brand has no stored website/profile", async () => {
    const repository = new FakeRepository();
    repository.brand = { id: "brand-1", workspaceId: "workspace-1", name: "New Brand" };
    const reader = new FakeReferenceReader();
    const service = new BrandBrainBootstrapService(repository, new FakeGenerator(), reader);

    await service.build("account-1", "brand-1", {
      primaryObjective: "generate-leads",
      publicReferenceUrl: "https://example.com/about",
    });

    expect(reader.calls).toEqual(["https://example.com/about"]);
    expect(repository.sources[0]?.sourceUrl).toBe("https://example.com/about");
  });

  it("tracks a successfully read public PDF as document evidence", async () => {
    const repository = new FakeRepository();
    repository.brand = { id: "brand-1", workspaceId: "workspace-1", name: "New Brand", publicSourceUrl: "https://example.com/brand.pdf" };
    const reader: PublicBrandReferenceReader = {
      read: async (url) => ({
        url,
        title: "Brand guide",
        excerpt: "A text-based public Brand guide.",
        retrievedAt: NOW,
        contentType: "application/pdf",
        sizeBytes: 2048,
      }),
    };
    const generator: BrandBrainProposalGenerator = {
      propose: async () => [{ section: "voice", fieldKey: "voice.tone", value: "Clear and practical.", sourceIds: ["source-1"] }],
    };
    const service = new BrandBrainBootstrapService(repository, generator, reader);

    await service.build("account-1", "brand-1", { primaryObjective: "build-authority" });

    expect(repository.sources[0]).toMatchObject({ type: "document", contentType: "application/pdf", sizeBytes: 2048 });
  });
});
