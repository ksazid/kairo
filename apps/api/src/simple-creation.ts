import { randomUUID } from "node:crypto";
import { DomainValidationError, ResourceNotFoundError } from "@kairo/domain";
import { ResearchService, type ResearchRepository } from "@kairo/domain/research-service";
import { CampaignService, type CampaignRepository } from "@kairo/domain/campaign-service";
import type { IdeaDevelopmentPort } from "./app";

export type SimpleCreationStatus = "queued"|"understanding-goal"|"researching"|"choosing-angle"|"building-campaign"|"ready"|"needs-attention";
export type ContentPreference = "auto"|"carousel"|"reel"|"image"|"campaign";
export interface SimpleCreationRequest { id:string; accountId:string; workspaceId:string; brandId:string; goal:string; input?:string; source?:string; contentPreference:ContentPreference; status:SimpleCreationStatus; ideaId?:string; recommendedAngleId?:string; campaignId?:string; recommendation?:Record<string,unknown>; failureReason?:string; attempt:number; createdAt:string; updatedAt:string }
export interface SimpleCreationStore {
  create(value:SimpleCreationRequest):Promise<SimpleCreationRequest>;
  get(accountId:string,brandId:string,id:string):Promise<SimpleCreationRequest|null>;
  claim(workerId:string,leaseSeconds:number):Promise<SimpleCreationRequest|null>;
  advance(id:string,workerId:string,status:SimpleCreationStatus,patch?:Partial<SimpleCreationRequest>):Promise<void>;
}
export interface StartSimpleCreationInput { goal:string; input?:string; source?:string; contentPreference?:ContentPreference }

export class SimpleCreationService {
  private research:ResearchService; private campaigns:CampaignService;
  constructor(private store:SimpleCreationStore,researchRepo:ResearchRepository,campaignRepo:CampaignRepository,private developer:IdeaDevelopmentPort,private now=()=>new Date()) { this.research=new ResearchService(researchRepo,now); this.campaigns=new CampaignService(campaignRepo,researchRepo,undefined,now); }
  async start(accountId:string,workspaceId:string,brandId:string,raw:StartSimpleCreationInput){
    const goal=text(raw?.goal,"goal",500), input=optional(raw?.input,4000), source=optional(raw?.source,2000), preference=raw?.contentPreference??"auto";
    if(!(["auto","carousel","reel","image","campaign"] as string[]).includes(preference))throw new DomainValidationError("contentPreference must be auto, carousel, reel, image, or campaign");
    const at=this.now().toISOString();
    return this.store.create({id:randomUUID(),accountId,workspaceId,brandId,goal,...(input?{input}:{}),...(source?{source}:{}),contentPreference:preference,status:"queued",attempt:0,createdAt:at,updatedAt:at});
  }
  async get(accountId:string,brandId:string,id:string){const value=await this.store.get(accountId,brandId,id);if(!value)throw new ResourceNotFoundError("Creation request not found");return publicView(value);}
  async runOnce(workerId:string){const job=await this.store.claim(workerId,900);if(!job)return false;try{
    await this.store.advance(job.id,workerId,"understanding-goal");
    let ideaId=job.ideaId;
    if(!ideaId){const premise=[job.goal,job.input&&`Input: ${job.input}`,job.source&&`Source: ${job.source}`].filter(Boolean).join("\n\n");const idea=await this.research.createUserIdea(job.accountId,job.workspaceId,job.brandId,{title:creationTitle(job,120),premise});ideaId=idea.id;await this.store.advance(job.id,workerId,"researching",{ideaId});}
    let bundle=await this.research.getIdea(job.accountId,job.brandId,ideaId);if(!bundle)throw new Error("Created Idea was not found");
    if(!bundle.research||bundle.angles.length<2){await this.store.advance(job.id,workerId,"researching",{ideaId});await this.developer.develop({accountId:job.accountId,workspaceId:job.workspaceId,brandId:job.brandId,brandContextVersion:`${job.brandId}@current`,idea:bundle.idea});bundle=await this.research.getIdea(job.accountId,job.brandId,ideaId);}
    if(!bundle?.research||!bundle.angles.length)throw new Error("Research did not produce a recommendation");
    await this.store.advance(job.id,workerId,"choosing-angle",{ideaId});
    const preferred=bundle.angles.find(a=>!["auto","campaign"].includes(job.contentPreference)&&a.recommendedFormat.toLowerCase().includes(job.contentPreference))??bundle.angles[0]!;
    if(preferred.status!=="selected")await this.research.selectAngle(job.accountId,job.brandId,ideaId,preferred.id,preferred.version);
    await this.store.advance(job.id,workerId,"building-campaign",{ideaId,recommendedAngleId:preferred.id});
    const existingCampaign=job.campaignId?undefined:(await this.campaigns.list(job.accountId,job.brandId)).find(item=>item.ideaId===ideaId&&item.angleId===preferred.id);
    const campaign=job.campaignId?await this.campaigns.get(job.accountId,job.brandId,job.campaignId):existingCampaign??await this.campaigns.createFromSelectedAngle(job.accountId,job.brandId,ideaId,{name:creationTitle(job,160),objective:preferred.objective});
    if(!campaign)throw new Error("Campaign was not found");
    const recommendation={title:preferred.title,framing:preferred.framing,format:["auto","campaign"].includes(job.contentPreference)?preferred.recommendedFormat:job.contentPreference,channel:preferred.recommendedChannel,reason:preferred.expectedValue,supportingClaimIds:preferred.supportingClaimIds,alternatives:bundle.angles.filter(angle=>angle.id!==preferred.id).slice(0,2).map(angle=>({id:angle.id,title:angle.title,framing:angle.framing,format:angle.recommendedFormat,channel:angle.recommendedChannel,reason:angle.expectedValue}))};
    const campaignId="campaign" in campaign?campaign.campaign.id:campaign.id;
    await this.store.advance(job.id,workerId,"ready",{ideaId,recommendedAngleId:preferred.id,campaignId,recommendation});return true;
  }catch(error){await this.store.advance(job.id,workerId,"needs-attention",{failureReason:safeError(error)});return true;}}
}
function publicView(v:SimpleCreationRequest){return {id:v.id,status:v.status,progress:{stage:v.status,message:messages[v.status]},contentPreference:v.contentPreference,...(v.recommendation?{recommendation:v.recommendation}:{}),...(v.campaignId?{campaignId:v.campaignId}:{}),...(v.status==="needs-attention"?{canRetry:true}:{}),createdAt:v.createdAt,updatedAt:v.updatedAt};}
const messages:Record<SimpleCreationStatus,string>={queued:"Getting your creation ready", "understanding-goal":"Understanding your goal",researching:"Finding evidence and useful directions","choosing-angle":"Choosing the strongest direction","building-campaign":"Building your recommendation",ready:"Your recommendation is ready","needs-attention":"We could not finish this creation yet"};
function creationTitle(job:Pick<SimpleCreationRequest,"goal"|"input">,max:number){return (job.input?.trim()||job.goal).slice(0,max)}
function text(v:unknown,n:string,max:number){const x=typeof v==="string"?v.trim():"";if(!x)throw new DomainValidationError(`${n} is required`);if(x.length>max)throw new DomainValidationError(`${n} is too long`);return x;} function optional(v:unknown,max:number){if(v==null)return undefined;const x=typeof v==="string"?v.trim():"";if(x.length>max)throw new DomainValidationError("Input is too long");return x||undefined;} function safeError(e:unknown){return e instanceof Error?e.message.slice(0,500):"Creation failed";}
