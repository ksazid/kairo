"use server";

import { redirect } from "next/navigation";
import { createContentAssetLibrary, type ContentAssetProvider } from "../../../../src/lib/content-asset-library-api";

export async function createContentAssetLibraryAction(brandId:string,formData:FormData){
  const name=String(formData.get("name")??"").trim();
  const provider=String(formData.get("provider")??"google-drive") as ContentAssetProvider;
  const base=`/brands/${encodeURIComponent(brandId)}/content-assets`;
  try{
    await createContentAssetLibrary(brandId,{name,provider});
  }catch(error){
    redirect(`${base}?error=${encodeURIComponent(safeCreateError(error))}`);
  }
  redirect(`${base}?created=1`);
}

function safeCreateError(error:unknown){
  const message=error instanceof Error?error.message:"";
  if(message==="Library name must be between 1 and 120 characters")return message;
  if(message==="Unsupported Content Asset provider")return message;
  if(message==="Authentication is required")return"Your session needs to be refreshed before creating a library.";
  return"Unable to create the library right now. Try again.";
}
