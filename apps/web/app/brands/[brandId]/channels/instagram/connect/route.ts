import { NextResponse } from "next/server";
import { beginInstagramConnection } from "../../../../../../src/lib/instagram-api";

export const dynamic="force-dynamic";
export async function GET(_request:Request,{params}:{params:Promise<{brandId:string}>}){
  const{brandId}=await params;
  try{const{authorizationUrl}=await beginInstagramConnection(brandId);return NextResponse.redirect(authorizationUrl)}catch(error){const message=error instanceof Error?error.message:"Unable to start Instagram connection";return NextResponse.redirect(new URL(`/brands/${encodeURIComponent(brandId)}/performance?error=${encodeURIComponent(message)}`,process.env.KAIRO_WEB_ORIGIN??"http://localhost:3000"))}
}
