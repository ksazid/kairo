import { ResourceNotFoundError, type KairoRepository } from "@kairo/domain";
import type { ChannelAccount, PublishAttempt, PublishCommand, PublishedPost } from "@kairo/domain/publishing";
import type { PublishingRepository } from "@kairo/domain/publishing-service";

export class MemoryPublishingRepository implements PublishingRepository {
  private channels=new Map<string,ChannelAccount>();private commands=new Map<string,PublishCommand>();private attempts=new Map<string,PublishAttempt>();private posts=new Map<string,PublishedPost>();
  constructor(private core:KairoRepository){}
  async saveChannelAccount(a:string,c:ChannelAccount){await this.scope(a,c.brandId);this.channels.set(c.id,structuredClone(c));return structuredClone(c)}
  async getChannelAccount(a:string,b:string,id:string){await this.scope(a,b);const c=this.channels.get(id);return c?.brandId===b?structuredClone(c):null}
  async listChannelAccounts(a:string,b:string){await this.scope(a,b);return [...this.channels.values()].filter(x=>x.brandId===b).map(x=>structuredClone(x))}
  async saveCommand(a:string,c:PublishCommand){await this.scope(a,c.brandId);this.commands.set(c.id,structuredClone(c));return structuredClone(c)}
  async getCommand(a:string,b:string,id:string){await this.scope(a,b);const c=this.commands.get(id);return c?.brandId===b?structuredClone(c):null}
  async listCommands(a:string,b:string,from?:string,to?:string){await this.scope(a,b);return [...this.commands.values()].filter(x=>x.brandId===b&&(!from||x.scheduledFor>=from)&&(!to||x.scheduledFor<=to)).sort((x,y)=>x.scheduledFor.localeCompare(y.scheduledFor)||x.id.localeCompare(y.id)).map(x=>structuredClone(x))}
  async saveAttempt(a:string,attempt:PublishAttempt){const command=[...this.commands.values()].find(x=>x.id===attempt.commandId);if(!command)throw new ResourceNotFoundError("Publish Command not found");await this.scope(a,command.brandId);this.attempts.set(attempt.id,structuredClone(attempt));return structuredClone(attempt)}
  async getLatestAttempt(a:string,b:string,commandId:string){const command=await this.getCommand(a,b,commandId);if(!command)return null;const match=[...this.attempts.values()].filter(x=>x.commandId===commandId).sort((x,y)=>y.attemptNumber-x.attemptNumber)[0];return match?structuredClone(match):null}
  async savePublishedPost(a:string,p:PublishedPost){await this.scope(a,p.brandId);this.posts.set(p.id,structuredClone(p));return structuredClone(p)}
  private async scope(a:string,b:string){const brand=await this.core.getBrandForAccount(a,b);if(!brand)throw new ResourceNotFoundError("Brand not found");return brand}
}
