import { NextRequest, NextResponse } from "next/server";
import { completeGoogleDriveContentAssetConnection } from "../../../../src/lib/content-asset-library-api";

export async function GET(request:NextRequest){
  const code=request.nextUrl.searchParams.get("code");
  const state=request.nextUrl.searchParams.get("state");
  const providerError=request.nextUrl.searchParams.get("error");
  if(providerError||!code||!state)return NextResponse.redirect(new URL("/?googleDrive=cancelled",request.nextUrl.origin));
  try{
    const completed=await completeGoogleDriveContentAssetConnection(code,state);
    const target=new URL(`/brands/${encodeURIComponent(completed.brandId)}/content-assets`,request.nextUrl.origin);
    target.searchParams.set("libraryId",completed.libraryId);
    target.searchParams.set("connected","1");
    return NextResponse.redirect(target);
  }catch{
    return NextResponse.redirect(new URL("/?googleDrive=connection-error",request.nextUrl.origin));
  }
}
