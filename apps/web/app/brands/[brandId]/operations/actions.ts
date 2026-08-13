"use server";
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { disableOperationsAutomation, requestOperationsRetry } from "../../../../src/lib/operations-api";

export async function retryOperationalFailureAction(brandId:string,failureId:string){
  try{
    await requestOperationsRetry(brandId,failureId,randomUUID());
    redirect(`/brands/${encodeURIComponent(brandId)}/operations?notice=${encodeURIComponent("Safe retry expedited")}`);
  }catch(error){
    redirect(`/brands/${encodeURIComponent(brandId)}/operations?error=${encodeURIComponent(error instanceof Error?error.message:"Unable to retry operation")}`);
  }
}

export async function disableAutomationAction(brandId:string,automationKey:string,expectedVersion:number,formData:FormData){
  const reason=String(formData.get("reason")??"").trim();
  try{
    await disableOperationsAutomation(brandId,automationKey,expectedVersion,reason);
    redirect(`/brands/${encodeURIComponent(brandId)}/operations?notice=${encodeURIComponent("Automation disabled")}`);
  }catch(error){
    redirect(`/brands/${encodeURIComponent(brandId)}/operations?error=${encodeURIComponent(error instanceof Error?error.message:"Unable to disable automation")}`);
  }
}
