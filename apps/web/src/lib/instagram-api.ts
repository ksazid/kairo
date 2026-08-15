import { cookies } from "next/headers";

export interface InstagramCandidateView { id:string;pageRef:string;pageName:string;accountRef:string;displayName:string;username?:string }
export type InstagramCompleteResult=
  |{status:"selection-required";intentId:string;brandId:string;candidates:InstagramCandidateView[]}
  |{status:"connected";intentId:string;brandId:string;connection:{id:string;accountRef:string;displayName:string;status:string}}
  |{status:"no-eligible-account";intentId:string;brandId:string};

export class InstagramApiError extends Error{constructor(message:string,readonly status:number){super(message)}}
function apiBase(){return(process.env.KAIRO_API_URL??"http://127.0.0.1:4000").replace(/\/$/,"")}
async function call<T>(path:string,init?:RequestInit):Promise<T>{const token=(await cookies()).get("kairo_access_token")?.value;if(!token)throw new InstagramApiError("Authentication is required",401);const response=await fetch(`${apiBase()}${path}`,{...init,cache:"no-store",headers:{authorization:`Bearer ${token}`,"content-type":"application/json",...(init?.headers??{})}});if(!response.ok){const body=await response.json().catch(()=>null) as{detail?:string}|null;throw new InstagramApiError(body?.detail??"Instagram connection request failed",response.status)}if(response.status===204)return undefined as T;return await response.json() as T}

export function beginInstagramConnection(brandId:string){return call<{authorizationUrl:string}>(`/api/v1/brands/${encodeURIComponent(brandId)}/channels/instagram/connect`,{method:"POST"})}
export function completeInstagramConnection(code:string,state:string){return call<InstagramCompleteResult>("/api/v1/channels/instagram/callback",{method:"POST",body:JSON.stringify({code,state})})}
export function getInstagramCandidates(brandId:string,intentId:string){return call<InstagramCandidateView[]>(`/api/v1/brands/${encodeURIComponent(brandId)}/channels/instagram/intents/${encodeURIComponent(intentId)}/candidates`)}
export function selectInstagramCandidate(brandId:string,intentId:string,candidateId:string){return call<{id:string;accountRef:string;displayName:string;status:string}>(`/api/v1/brands/${encodeURIComponent(brandId)}/channels/instagram/intents/${encodeURIComponent(intentId)}/select`,{method:"POST",body:JSON.stringify({candidateId})})}
export function disconnectInstagramConnection(brandId:string,channelAccountId:string){return call<void>(`/api/v1/brands/${encodeURIComponent(brandId)}/channels/instagram/${encodeURIComponent(channelAccountId)}/disconnect`,{method:"POST"})}
