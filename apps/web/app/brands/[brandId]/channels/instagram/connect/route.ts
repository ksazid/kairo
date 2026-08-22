import { NextRequest, NextResponse } from "next/server";
import { beginInstagramConnection } from "../../../../../../src/lib/instagram-api";
import { OAUTH_RETURN_COOKIE, safeBrandReturnTo } from "../../../../../../src/lib/brand-source-navigation";

export const dynamic="force-dynamic";
export async function GET(request:NextRequest,{params}:{params:Promise<{brandId:string}>}){
  const{brandId}=await params;
  const returnTo=safeBrandReturnTo(request.nextUrl.searchParams.get("returnTo"),brandId);
  try{
    const{authorizationUrl}=await beginInstagramConnection(brandId);
    const response=NextResponse.redirect(authorizationUrl);
    response.cookies.set(OAUTH_RETURN_COOKIE,returnTo,{httpOnly:true,sameSite:"lax",secure:request.nextUrl.protocol==="https:",maxAge:600,path:"/channels/instagram/callback"});
    return response;
  }catch(error){
    const message=error instanceof Error?error.message:"Unable to start Instagram connection";
    const target=new URL(returnTo,request.url);target.searchParams.set("error",message);
    return NextResponse.redirect(target);
  }
}
