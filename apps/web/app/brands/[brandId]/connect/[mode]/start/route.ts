import { NextRequest, NextResponse } from "next/server";
import { beginMetaConnection } from "../../../../../../src/lib/meta-connection-api";
import type { BrandConnectionOption } from "../../../../../../src/lib/brand-connection-plan";
import { META_RETURN_COOKIE, safeBrandReturnTo } from "../../../../../../src/lib/brand-source-navigation";

export const dynamic="force-dynamic";
const MODES=new Set<BrandConnectionOption>(["instagram","facebook-instagram","facebook"]);
export async function GET(request:NextRequest,{params}:{params:Promise<{brandId:string;mode:string}>}){const{brandId,mode}=await params;const fallback=safeBrandReturnTo(request.nextUrl.searchParams.get("returnTo"),brandId);if(!MODES.has(mode as BrandConnectionOption)){const target=new URL(fallback,request.url);target.searchParams.set("error","Connection type is not supported");return NextResponse.redirect(target)}try{const{authorizationUrl}=await beginMetaConnection(brandId,mode as BrandConnectionOption);const response=NextResponse.redirect(authorizationUrl);response.cookies.set(META_RETURN_COOKIE,fallback,{httpOnly:true,sameSite:"lax",secure:request.nextUrl.protocol==="https:",maxAge:600,path:"/channels/meta"});return response}catch(error){const target=new URL(fallback,request.url);target.searchParams.set("error",error instanceof Error?error.message:"Unable to start connection");return NextResponse.redirect(target)}}
