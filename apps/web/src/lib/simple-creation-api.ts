import { cookies } from "next/headers";
import type { SimpleCreationPresenterDto } from "@kairo/contracts/presenter";
export type CreationStatus = "queued"|"understanding-goal"|"researching"|"choosing-angle"|"building-campaign"|"ready"|"needs-attention";
export type CreationFormat = "auto"|"carousel"|"reel"|"image"|"video"|"campaign";
export interface SimpleCreationView {
  id:string;
  status:CreationStatus;
  progress:{stage:CreationStatus;message:string};
  contentPreference:CreationFormat;
  mediaAssetIds:string[];
  presenter?:SimpleCreationPresenterDto;
  recommendation?:{title?:string;framing?:string;format?:string;channel?:string;reason?:string;supportingClaimIds?:string[];alternatives?:Array<{title:string;framing:string;format:string;channel:string}>};
  campaignId?:string;
  assetId?:string;
  canRetry?:boolean;
  createdAt:string;
  updatedAt:string;
}
class SimpleCreationApiError extends Error {}
function base(){return(process.env.KAIRO_API_URL??"http://127.0.0.1:4000").replace(/\/$/,"");}
async function call<T>(path:string,init?:RequestInit){const token=(await cookies()).get("kairo_access_token")?.value;if(!token)throw new SimpleCreationApiError("Authentication is required");const response=await fetch(`${base()}${path}`,{...init,cache:"no-store",headers:{authorization:`Bearer ${token}`,...(init?.body?{"content-type":"application/json"}:{})}});if(!response.ok){const p=(await response.json().catch(()=>null))as{detail?:string}|null;throw new SimpleCreationApiError(p?.detail??"Unable to create content");}return(await response.json())as T;}
export function startSimpleCreation(brandId:string,input:{goal:string;input?:string;source?:string;contentPreference?:CreationFormat;presenterId?:string;mediaAssetIds?:string[]}){return call<SimpleCreationView>(`/api/v1/brands/${encodeURIComponent(brandId)}/simple-creations`,{method:"POST",body:JSON.stringify(input)});}
export function getSimpleCreation(brandId:string,id:string){return call<SimpleCreationView>(`/api/v1/brands/${encodeURIComponent(brandId)}/simple-creations/${encodeURIComponent(id)}`);}
