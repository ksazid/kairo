"use server";
import{redirect}from"next/navigation";
import{decideLearning}from"../../../../src/lib/kairo-api";
import{disconnectInstagramConnection,selectInstagramCandidate}from"../../../../src/lib/instagram-api";

export async function reviewLearningAction(brandId:string,id:string,version:number,action:"accept"|"reject"){try{await decideLearning(brandId,id,{action,expectedVersion:version,...(action==="reject"?{reason:"Rejected by user from Performance review"}:{})});redirect(`/brands/${encodeURIComponent(brandId)}/performance?notice=${encodeURIComponent(action==="accept"?"Learning accepted":"Learning rejected")}`)}catch(e){redirect(`/brands/${encodeURIComponent(brandId)}/performance?error=${encodeURIComponent(e instanceof Error?e.message:"Unable to review Learning")}`)}}

export async function selectInstagramAction(brandId:string,intentId:string,candidateId:string){try{await selectInstagramCandidate(brandId,intentId,candidateId);redirect(`/brands/${encodeURIComponent(brandId)}/performance?notice=${encodeURIComponent("Instagram connected")}`)}catch(e){redirect(`/brands/${encodeURIComponent(brandId)}/performance?instagramIntent=${encodeURIComponent(intentId)}&error=${encodeURIComponent(e instanceof Error?e.message:"Unable to connect Instagram")}`)}}

export async function disconnectInstagramAction(brandId:string,channelAccountId:string){try{await disconnectInstagramConnection(brandId,channelAccountId);redirect(`/brands/${encodeURIComponent(brandId)}/performance?notice=${encodeURIComponent("Instagram disconnected")}`)}catch(e){redirect(`/brands/${encodeURIComponent(brandId)}/performance?error=${encodeURIComponent(e instanceof Error?e.message:"Unable to disconnect Instagram")}`)}}
