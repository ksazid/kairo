import { randomUUID } from "node:crypto";
import type { KairoRepository } from "./index";
import { ResourceNotFoundError } from "./index";
import type { CampaignRepository } from "./campaign-service";
import type { ReviewRepository } from "./review-service";
import { applyPublishAttempt, beginPublishAttempt, cancelPublishCommand, connectChannelAccount, createPublishCommand, createPublishedPost, reconcilePublishAttempt, retryPublishCommand, type ChannelAccount, type PublishAttempt, type PublishCapability, type PublishChannel, type PublishCommand, type PublishContentType, type PublishedPost } from "./publishing";

export interface PublishingRepository {
  saveChannelAccount(accountId:string, channel:ChannelAccount):Promise<ChannelAccount>;
  getChannelAccount(accountId:string, brandId:string, id:string):Promise<ChannelAccount|null>;
  listChannelAccounts(accountId:string, brandId:string):Promise<ChannelAccount[]>;
  saveCommand(accountId:string, command:PublishCommand):Promise<PublishCommand>;
  getCommand(accountId:string, brandId:string, id:string):Promise<PublishCommand|null>;
  listCommands(accountId:string, brandId:string, from?:string, to?:string):Promise<PublishCommand[]>;
  cancelCommand(accountId:string,brandId:string,id:string):Promise<PublishCommand>;
  recordDispatch(accountId:string, command:PublishCommand, attempt:PublishAttempt):Promise<PublishAttempt>;
  getLatestAttempt(accountId:string, brandId:string, commandId:string):Promise<PublishAttempt|null>;
  recordOutcome(accountId:string, command:PublishCommand, attempt:PublishAttempt, post?:PublishedPost):Promise<PublishCommand>;
}

export class PublishingService {
  constructor(private core:KairoRepository,private campaigns:CampaignRepository,private reviews:ReviewRepository,private publishing:PublishingRepository,private now:()=>Date=()=>new Date()){}
  async connect(accountId:string,brandId:string,input:{channel:PublishChannel;accountRef:string;displayName:string;credentialRef:string;capabilities:PublishCapability[]}){const brand=await this.core.getBrandForAccount(accountId,brandId);if(!brand)throw new ResourceNotFoundError("Brand not found");return this.publishing.saveChannelAccount(accountId,connectChannelAccount({id:randomUUID(),workspaceId:brand.workspaceId,brandId,connectedAt:this.now().toISOString(),...input}))}
  accounts(accountId:string,brandId:string){return this.publishing.listChannelAccounts(accountId,brandId)}
  async schedule(accountId:string,brandId:string,campaignId:string,assetId:string,input:{channelAccountId:string;contentType:PublishContentType;scheduledFor:string}){const detail=await this.campaigns.getCampaign(accountId,brandId,campaignId);if(!detail)throw new ResourceNotFoundError("Campaign not found");const entry=detail.assets.find(x=>x.asset.id===assetId);if(!entry)throw new ResourceNotFoundError("Content Asset not found");const version=entry.versions.at(-1);if(!version)throw new ResourceNotFoundError("Content Version not found");const approval=await this.reviews.getApproval(accountId,brandId,assetId);if(!approval)throw new ResourceNotFoundError("Content Approval not found");const channel=await this.publishing.getChannelAccount(accountId,brandId,input.channelAccountId);if(!channel)throw new ResourceNotFoundError("Channel Account not found");return this.publishing.saveCommand(accountId,createPublishCommand({id:randomUUID(),approval,currentVersionId:version.id,channelAccount:channel,contentType:input.contentType,scheduledFor:input.scheduledFor,createdAt:this.now().toISOString()}))}
  calendar(accountId:string,brandId:string,from?:string,to?:string){return this.publishing.listCommands(accountId,brandId,from,to)}
  async begin(accountId:string,brandId:string,commandId:string){const command=await this.requireCommand(accountId,brandId,commandId);const attempt=beginPublishAttempt({id:randomUUID(),command,startedAt:this.now().toISOString()});return this.publishing.recordDispatch(accountId,applyPublishAttempt(command,attempt),attempt)}
  async reconcile(accountId:string,brandId:string,commandId:string,input:{outcome:"published"|"failed"|"unknown";externalPostId?:string;providerCorrelationId?:string;failureCode?:string}){const command=await this.requireCommand(accountId,brandId,commandId);const current=await this.publishing.getLatestAttempt(accountId,brandId,commandId);if(!current)throw new ResourceNotFoundError("Publish Attempt not found");const attempt=reconcilePublishAttempt({attempt:current,checkedAt:this.now().toISOString(),...input});const completed=applyPublishAttempt(command,attempt);const post=completed.status==="published"?createPublishedPost({id:randomUUID(),command:completed,attempt}):undefined;return this.publishing.recordOutcome(accountId,completed,attempt,post)}
  async retry(accountId:string,brandId:string,commandId:string){const command=await this.requireCommand(accountId,brandId,commandId);return this.publishing.saveCommand(accountId,retryPublishCommand(command,this.now().toISOString()))}
  async cancel(accountId:string,brandId:string,commandId:string){const command=await this.requireCommand(accountId,brandId,commandId);cancelPublishCommand(command);return this.publishing.cancelCommand(accountId,brandId,commandId)}
  private async requireCommand(accountId:string,brandId:string,id:string){const command=await this.publishing.getCommand(accountId,brandId,id);if(!command)throw new ResourceNotFoundError("Publish Command not found");return command}
}
