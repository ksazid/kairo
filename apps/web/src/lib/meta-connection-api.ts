import { cookies } from "next/headers";
import type { BrandConnectionOption } from "./brand-connection-plan";

export type MetaAuthMethod = "instagram-login" | "facebook-login";
export interface MetaCandidateView { id:string;channel:"instagram"|"facebook";authMethod:MetaAuthMethod;accountRef:string;displayName:string;pageRef?:string;pageName?:string;username?:string }
export interface MetaConnectionHealth { id:string;channel:"instagram"|"facebook";authMethod:MetaAuthMethod;accountRef:string;displayName:string;status:"connected"|"reconnect-required";tokenExpiresAt?:string;lastVerifiedAt?:string;grantedScopes:string[];lastSourceSyncAt?:string;sourceStatus?:string;healthy:boolean;issue?:"reconnect-required"|"token-expired"|"source-sync-failed" }
export type MetaCompleteResult=
  |{status:"selection-required";intentId:string;brandId:string;candidates:MetaCandidateView[]}
  |{status:"connected";intentId:string;brandId:string;connection:{id:string;channel:"instagram"|"facebook";authMethod?:MetaAuthMethod;accountRef:string;displayName:string;status:string}}
  |{status:"no-eligible-account";intentId:string;brandId:string};

export class MetaConnectionApiError extends Error { constructor(message:string,readonly status:number){super(message)} }
function apiBase(){return(process.env.KAIRO_API_URL??"http://127.0.0.1:4000").replace(/\/$/,"")}
async function call<T>(path:string,init?:RequestInit):Promise<T>{const token=(await cookies()).get("kairo_access_token")?.value;if(!token)throw new MetaConnectionApiError("Authentication is required",401);const headers=new Headers(init?.headers);headers.set("authorization",`Bearer ${token}`);if(init?.body!=null)headers.set("content-type","application/json");const response=await fetch(`${apiBase()}${path}`,{...init,cache:"no-store",headers});if(!response.ok){const body=await response.json().catch(()=>null)as{detail?:string}|null;throw new MetaConnectionApiError(body?.detail??"Meta connection request failed",response.status)}if(response.status===204)return undefined as T;return await response.json()as T}

export function beginMetaConnection(brandId:string,mode:BrandConnectionOption){return call<{authorizationUrl:string}>(`/api/v1/brands/${encodeURIComponent(brandId)}/channels/meta/${encodeURIComponent(mode)}/connect`,{method:"POST"})}
export function completeMetaConnection(mode:string,code:string,state:string){return call<MetaCompleteResult>(`/api/v1/channels/meta/${encodeURIComponent(mode)}/callback`,{method:"POST",body:JSON.stringify({code,state})})}
export function getMetaCandidates(brandId:string,intentId:string){return call<MetaCandidateView[]>(`/api/v1/brands/${encodeURIComponent(brandId)}/channels/meta/intents/${encodeURIComponent(intentId)}/candidates`)}
export function selectMetaCandidate(brandId:string,intentId:string,candidateId:string){return call<{id:string;channel:string;accountRef:string;displayName:string;status:string}>(`/api/v1/brands/${encodeURIComponent(brandId)}/channels/meta/intents/${encodeURIComponent(intentId)}/select`,{method:"POST",body:JSON.stringify({candidateId})})}
export function getMetaConnectionHealth(brandId:string){return call<MetaConnectionHealth[]>(`/api/v1/brands/${encodeURIComponent(brandId)}/channels/meta/health`)}
export function disconnectMetaConnection(brandId:string,channelAccountId:string){return call<void>(`/api/v1/brands/${encodeURIComponent(brandId)}/channels/meta/${encodeURIComponent(channelAccountId)}/disconnect`,{method:"POST"})}
