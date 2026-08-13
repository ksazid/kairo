"use server";
import { randomUUID } from "node:crypto";
import { disableOperationsAutomation, requestOperationsRetry } from "../../../../src/lib/operations-api";

export async function retryOperationalFailureAction(brandId:string,failureId:string){
  await requestOperationsRetry(brandId,failureId,randomUUID());
}

export async function disableAutomationAction(brandId:string,automationKey:string,expectedVersion:number,formData:FormData){
  const reason=String(formData.get("reason")??"").trim();
  await disableOperationsAutomation(brandId,automationKey,expectedVersion,reason);
}
