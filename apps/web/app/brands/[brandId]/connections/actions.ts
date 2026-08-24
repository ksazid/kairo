"use server";

import { redirect } from "next/navigation";
import { disconnectMetaConnection, selectMetaCandidate } from "../../../../src/lib/meta-connection-api";
import { safeBrandReturnTo } from "../../../../src/lib/brand-source-navigation";

export async function selectMetaConnectionAction(brandId:string,intentId:string,candidateId:string,returnTo:string){
  const target=safeBrandReturnTo(returnTo,brandId);
  try{await selectMetaCandidate(brandId,intentId,candidateId)}catch(error){
    redirect(`/brands/${encodeURIComponent(brandId)}/connections/select?intent=${encodeURIComponent(intentId)}&returnTo=${encodeURIComponent(target)}&error=${encodeURIComponent(error instanceof Error?error.message:"Unable to connect account")}`);
  }
  const next=new URL(target,"https://kairo.local");
  next.searchParams.set("notice","Connection complete");
  redirect(`${next.pathname}${next.search}`);
}

export async function disconnectMetaConnectionAction(brandId:string,channelAccountId:string,returnTo?:string){
  const fallback=`/brands/${encodeURIComponent(brandId)}/channels`;
  const target=safeBrandReturnTo(returnTo??fallback,brandId);
  try{await disconnectMetaConnection(brandId,channelAccountId)}catch(error){
    const next=new URL(target,"https://kairo.local");
    next.searchParams.set("error",error instanceof Error?error.message:"Unable to disconnect account");
    redirect(`${next.pathname}${next.search}`);
  }
  const next=new URL(target,"https://kairo.local");
  next.searchParams.set("notice","Connection removed");
  redirect(`${next.pathname}${next.search}`);
}
