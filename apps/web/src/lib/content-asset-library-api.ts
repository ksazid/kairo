import { cookies } from "next/headers";

export type ContentAssetProvider = "google-drive" | "manual";
export type ContentAssetLibraryStatus = "not-connected" | "connected" | "needs-attention";
export type ContentAssetKind = "image" | "video" | "document" | "other";

export interface ContentAssetLibraryView {
  id:string;workspaceId:string;brandId:string;name:string;provider:ContentAssetProvider;status:ContentAssetLibraryStatus;externalRootRef?:string;providerLabel?:string;createdAt:string;updatedAt:string;
}
export interface ContentLibraryAssetView {
  id:string;workspaceId:string;brandId:string;libraryId:string;externalId:string;name:string;kind:ContentAssetKind;mimeType:string;sizeBytes?:number;modifiedAt?:string;providerRef?:string;previewRef?:string;indexedAt:string;
}

function apiBase(){return(process.env.KAIRO_API_URL??"http://127.0.0.1:4000").replace(/\/$/,"")}
async function authorizedFetch(path:string,init?:RequestInit){const token=(await cookies()).get("kairo_access_token")?.value;if(!token)return null;return fetch(`${apiBase()}${path}`,{...init,cache:"no-store",headers:{authorization:`Bearer ${token}`,"content-type":"application/json",...(init?.headers??{})}})}
async function bodyOrError<T>(response:Response|null,fallback:string):Promise<T>{if(!response)throw new Error("Authentication is required");if(!response.ok){const body=await response.json().catch(()=>null) as {detail?:string}|null;throw new Error(body?.detail??fallback)}return await response.json() as T}

export async function getContentAssetLibraries(brandId:string):Promise<ContentAssetLibraryView[]>{return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/content-asset-libraries`),"Unable to load Content Asset Libraries")}
export async function createContentAssetLibrary(brandId:string,input:{name:string;provider?:ContentAssetProvider}):Promise<ContentAssetLibraryView>{return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/content-asset-libraries`,{method:"POST",body:JSON.stringify(input)}),"Unable to create Content Asset Library")}
export async function getContentLibraryAssets(brandId:string,input:{libraryId?:string;kind?:ContentAssetKind;q?:string}={}):Promise<ContentLibraryAssetView[]>{const query=new URLSearchParams();if(input.libraryId)query.set("libraryId",input.libraryId);if(input.kind)query.set("kind",input.kind);if(input.q?.trim())query.set("q",input.q.trim());return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/content-assets${query.size?`?${query.toString()}`:""}`),"Unable to load Content Assets")}
