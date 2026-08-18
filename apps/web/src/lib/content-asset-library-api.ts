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
export interface GoogleDrivePickerConfig { accessToken:string;expiresInSeconds:number;developerKey:string;appId:string; }

function apiBase(){return(process.env.KAIRO_API_URL??"http://127.0.0.1:4000").replace(/\/$/,"")}
async function authorizedFetch(path:string,init?:RequestInit){const token=(await cookies()).get("kairo_access_token")?.value;if(!token)return null;return fetch(`${apiBase()}${path}`,{...init,cache:"no-store",headers:{authorization:`Bearer ${token}`,"content-type":"application/json",...(init?.headers??{})}})}
async function bodyOrError<T>(response:Response|null,fallback:string):Promise<T>{if(!response)throw new Error("Authentication is required");if(!response.ok){const body=await response.json().catch(()=>null) as {detail?:string}|null;throw new Error(body?.detail??fallback)}return await response.json() as T}
async function voidOrError(response:Response|null,fallback:string){if(!response)throw new Error("Authentication is required");if(!response.ok){const body=await response.json().catch(()=>null) as {detail?:string}|null;throw new Error(body?.detail??fallback)}}

export async function getContentAssetLibraries(brandId:string):Promise<ContentAssetLibraryView[]>{return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/content-asset-libraries`),"Unable to load Content Asset Libraries")}
export async function createContentAssetLibrary(brandId:string,input:{name:string;provider?:ContentAssetProvider}):Promise<ContentAssetLibraryView>{return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/content-asset-libraries`,{method:"POST",body:JSON.stringify(input)}),"Unable to create Content Asset Library")}
export async function getContentLibraryAssets(brandId:string,input:{libraryId?:string;kind?:ContentAssetKind;q?:string}={}):Promise<ContentLibraryAssetView[]>{const query=new URLSearchParams();if(input.libraryId)query.set("libraryId",input.libraryId);if(input.kind)query.set("kind",input.kind);if(input.q?.trim())query.set("q",input.q.trim());return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/content-assets${query.size?`?${query.toString()}`:""}`),"Unable to load Content Assets")}

export async function getGoogleDriveContentAssetCapability():Promise<{enabled:boolean}>{return bodyOrError(await authorizedFetch("/api/v1/content-assets/google-drive/capability"),"Unable to check Google Drive availability")}
export async function beginGoogleDriveContentAssetConnection(brandId:string,libraryId:string):Promise<{authorizationUrl:string}>{return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/content-asset-libraries/${encodeURIComponent(libraryId)}/google-drive/connect`,{method:"POST",body:"{}"}),"Unable to start Google Drive connection")}
export async function completeGoogleDriveContentAssetConnection(code:string,state:string):Promise<{brandId:string;libraryId:string;status:"connected"}>{return bodyOrError(await authorizedFetch("/api/v1/content-assets/google-drive/callback",{method:"POST",body:JSON.stringify({code,state})}),"Unable to complete Google Drive connection")}
export async function getGoogleDrivePickerConfig(brandId:string,libraryId:string):Promise<GoogleDrivePickerConfig>{return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/content-asset-libraries/${encodeURIComponent(libraryId)}/google-drive/picker`),"Unable to open Google Drive Picker")}
export async function selectGoogleDriveContentAssetRoot(brandId:string,libraryId:string,fileId:string):Promise<{library:ContentAssetLibraryView;folder:{id:string;name:string}}>{return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/content-asset-libraries/${encodeURIComponent(libraryId)}/google-drive/root`,{method:"POST",body:JSON.stringify({fileId})}),"Unable to select Google Drive folder")}
export async function indexGoogleDriveContentAssetLibrary(brandId:string,libraryId:string):Promise<{indexedCount:number;partial:boolean}>{return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/content-asset-libraries/${encodeURIComponent(libraryId)}/google-drive/index`,{method:"POST",body:"{}"}),"Unable to index Google Drive library")}
export async function disconnectGoogleDriveContentAssetLibrary(brandId:string,libraryId:string){return voidOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/content-asset-libraries/${encodeURIComponent(libraryId)}/google-drive/disconnect`,{method:"POST",body:"{}"}),"Unable to disconnect Google Drive")}
