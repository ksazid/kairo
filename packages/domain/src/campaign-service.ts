import { randomUUID } from "node:crypto";
import { DomainValidationError, ResourceNotFoundError } from "./index";
import type { ResearchRepository } from "./research-service";
import { appendContentVersion, createCampaign, createContentAsset, createInitialContentVersion, type Campaign, type ContentAsset, type ContentChannel, type ContentVersion } from "./campaign";

export interface CampaignDetail { campaign: Campaign; assets: Array<{ asset: ContentAsset; versions: ContentVersion[] }> }
export interface CampaignRepository {
  saveCampaign(accountId: string, campaign: Campaign): Promise<Campaign>;
  listCampaigns(accountId: string, brandId: string): Promise<Campaign[]>;
  getCampaign(accountId: string, brandId: string, campaignId: string): Promise<CampaignDetail | null>;
  saveAssetWithVersion(accountId: string, asset: ContentAsset, version: ContentVersion): Promise<CampaignDetail>;
  appendVersion(accountId: string, brandId: string, campaignId: string, assetId: string, expectedVersion: number, build: (asset: ContentAsset, parent: ContentVersion) => ContentVersion | Promise<ContentVersion>): Promise<CampaignDetail>;
}
export type GenerateContentAction = "initial-draft"|"alternative"|"simplify"|"expand"|"adjust-depth"|"strengthen-opening"|"regenerate-section";
export interface ContentGenerationPort { generate(input:{workspaceId:string;brandId:string;brandContextVersion:string;campaign:Campaign;asset:ContentAsset;parent:ContentVersion;action:GenerateContentAction;section?:string;claims:Array<{id:string;text:string;classification:string;verificationState:string}>}):Promise<ContentVersion> }

export class CampaignService {
  constructor(private readonly campaigns: CampaignRepository, private readonly research: ResearchRepository, private readonly generator?:ContentGenerationPort, private readonly now: () => Date = () => new Date()) {}
  async createFromSelectedAngle(accountId: string, brandId: string, ideaId: string, input: { name: string; objective: string }): Promise<Campaign> {
    const bundle = await this.research.getIdeaBundle(accountId, brandId, ideaId);
    if (!bundle?.research) throw new ResourceNotFoundError("Research-ready Idea not found");
    const angle = bundle.angles.find((item) => item.status === "selected");
    if (!angle) throw new DomainValidationError("Campaign requires a selected Angle");
    return this.campaigns.saveCampaign(accountId, createCampaign({ id: randomUUID(), name: input.name, objective: input.objective, createdAt: this.now().toISOString(), lineage: { workspaceId: bundle.idea.workspaceId, brandId, ideaId, researchId: bundle.research.id, angleId: angle.id, angleStatus: angle.status, supportingClaimIds: angle.supportingClaimIds } }));
  }
  list(accountId: string, brandId: string): Promise<Campaign[]> { return this.campaigns.listCampaigns(accountId, brandId); }
  get(accountId: string, brandId: string, campaignId: string): Promise<CampaignDetail | null> { return this.campaigns.getCampaign(accountId, brandId, campaignId); }
  async createAsset(accountId: string, brandId: string, campaignId: string, input: { channel: ContentChannel; format: string; audience: string; topic: string; hookType: string; cta: string; content: string }): Promise<CampaignDetail> {
    const detail = await this.campaigns.getCampaign(accountId, brandId, campaignId);
    if (!detail) throw new ResourceNotFoundError("Campaign not found");
    const asset = createContentAsset({ id: randomUUID(), campaign: detail.campaign, channel: input.channel, format: input.format, audience: input.audience, topic: input.topic, hookType: input.hookType, cta: input.cta, createdAt: this.now().toISOString() });
    const version = createInitialContentVersion({ id: randomUUID(), asset, content: input.content, supportingClaimIds: detail.campaign.supportingClaimIds, actor: "user", action: "manual-edit", createdAt: this.now().toISOString() });
    return this.campaigns.saveAssetWithVersion(accountId, { ...asset, currentVersion: 1 }, version);
  }
  appendManualEdit(accountId: string, brandId: string, campaignId: string, assetId: string, input: { expectedVersion: number; content: string }): Promise<CampaignDetail> {
    if (!Number.isInteger(input.expectedVersion) || input.expectedVersion < 1) throw new DomainValidationError("expectedVersion must be a positive integer");
    return this.campaigns.appendVersion(accountId, brandId, campaignId, assetId, input.expectedVersion, (asset, parent) => appendContentVersion({ id: randomUUID(), asset, parent, expectedVersion: input.expectedVersion, content: input.content, supportingClaimIds: parent.supportingClaimIds, actor: "user", action: "manual-edit", createdAt: this.now().toISOString() }));
  }
  async generateVersion(accountId:string,brandId:string,campaignId:string,assetId:string,input:{expectedVersion:number;action:GenerateContentAction;section?:string;brandContextVersion:string}):Promise<CampaignDetail>{
    if(!this.generator)throw new DomainValidationError("Content generation is not configured");
    if(!Number.isInteger(input.expectedVersion)||input.expectedVersion<1)throw new DomainValidationError("expectedVersion must be a positive integer");
    const detail=await this.campaigns.getCampaign(accountId,brandId,campaignId);if(!detail)throw new ResourceNotFoundError("Campaign not found");
    const bundle=await this.research.getIdeaBundle(accountId,brandId,detail.campaign.ideaId);if(!bundle?.research)throw new ResourceNotFoundError("Campaign Research not found");const research=bundle.research;
    return this.campaigns.appendVersion(accountId,brandId,campaignId,assetId,input.expectedVersion,(asset,parent)=>this.generator!.generate({workspaceId:detail.campaign.workspaceId,brandId,brandContextVersion:input.brandContextVersion,campaign:detail.campaign,asset,parent,action:input.action,...(input.section?{section:input.section}:{}),claims:research.claims.map(c=>({id:c.id,text:c.text,classification:c.classification,verificationState:c.verificationState}))}));
  }
}
