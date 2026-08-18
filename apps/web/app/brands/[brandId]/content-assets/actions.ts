"use server";

import { redirect } from "next/navigation";
import {
  beginGoogleDriveContentAssetConnection,
  createContentAssetLibrary,
  disconnectGoogleDriveContentAssetLibrary,
  getGoogleDrivePickerConfig,
  indexGoogleDriveContentAssetLibrary,
  selectGoogleDriveContentAssetRoot,
  type ContentAssetProvider,
} from "../../../../src/lib/content-asset-library-api";

export async function createContentAssetLibraryAction(brandId:string,formData:FormData){
  const name=String(formData.get("name")??"").trim();
  const provider=String(formData.get("provider")??"google-drive") as ContentAssetProvider;
  const base=contentAssetsPath(brandId);
  try{await createContentAssetLibrary(brandId,{name,provider})}catch(error){redirect(`${base}?error=${encodeURIComponent(safeCreateError(error))}`)}
  redirect(`${base}?created=1`);
}

export async function connectGoogleDriveAction(brandId:string,libraryId:string){
  const base=contentAssetsPath(brandId);
  let authorizationUrl:string;
  try{({authorizationUrl}=await beginGoogleDriveContentAssetConnection(brandId,libraryId))}catch{redirect(`${base}?error=${encodeURIComponent("Google Drive connection could not be started. Try again.")}&libraryId=${encodeURIComponent(libraryId)}`)}
  redirect(authorizationUrl);
}

export async function indexGoogleDriveLibraryAction(brandId:string,libraryId:string){
  const base=contentAssetsPath(brandId);
  let result:{indexedCount:number;partial:boolean};
  try{result=await indexGoogleDriveContentAssetLibrary(brandId,libraryId)}catch{redirect(`${base}?libraryId=${encodeURIComponent(libraryId)}&error=${encodeURIComponent("Google Drive indexing could not complete. Check the connection and try again.")}`)}
  redirect(`${base}?libraryId=${encodeURIComponent(libraryId)}&indexed=${result.indexedCount}&partial=${result.partial?"1":"0"}`);
}

export async function disconnectGoogleDriveLibraryAction(brandId:string,libraryId:string){
  const base=contentAssetsPath(brandId);
  try{await disconnectGoogleDriveContentAssetLibrary(brandId,libraryId)}catch{redirect(`${base}?libraryId=${encodeURIComponent(libraryId)}&error=${encodeURIComponent("Google Drive could not be disconnected. Try again.")}`)}
  redirect(`${base}?disconnected=1`);
}

export async function getGoogleDrivePickerConfigAction(brandId:string,libraryId:string){
  try{return{ok:true as const,config:await getGoogleDrivePickerConfig(brandId,libraryId)}}catch{return{ok:false as const,message:"Google Drive access needs attention. Reconnect this library and try again."}}
}
export async function selectGoogleDriveRootAction(brandId:string,libraryId:string,fileId:string){
  try{const result=await selectGoogleDriveContentAssetRoot(brandId,libraryId,fileId);return{ok:true as const,folder:result.folder}}catch{return{ok:false as const,message:"Kairo could not use that Drive folder. Choose an accessible folder or reconnect Google Drive."}}
}

function contentAssetsPath(brandId:string){return`/brands/${encodeURIComponent(brandId)}/content-assets`}
function safeCreateError(error:unknown){
  const message=error instanceof Error?error.message:"";
  if(message==="Library name must be between 1 and 120 characters")return message;
  if(message==="Unsupported Content Asset provider")return message;
  if(message==="Authentication is required")return"Your session needs to be refreshed before creating a library.";
  return"Unable to create the library right now. Try again.";
}
