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
    const message=error instanceof Error?error.message:"Unable to create Content Asset Library";
    redirect(`${base}?error=${encodeURIComponent(message)}`);
  }
  redirect(`${base}?created=1`);
}
