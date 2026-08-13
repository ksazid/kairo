import "server-only";
import { KairoApiError } from "./kairo-api";
import { kairoServerFetch } from "./server-api";

export type OperationsStage="brand-setup"|"hunter"|"research"|"generation"|"critic"|"publishing"|"metrics";
export interface OperationalFailureView{id:string;workspaceId:string;brandId:string;workflowId:string;stage:OperationsStage;diagnosticCode:string;summary:string;retryDisposition:"safe"|"manual-review"|"blocked";attempt:number;maxAttempts:number;state:"failed";occurredAt:string;traceId?:string}
export interface OperationsBudgetView{id:string;workspaceId:string;brandId:string;workflowId:string;currency:string;limitMicros:number;spentMicros:number;remainingMicros:number;status:"active"|"exhausted";createdAt:string}
export interface OperationsCostView{id:string;workspaceId:string;brandId:string;workflowId:string;kind:"model"|"search"|"tool"|"social";provider:string;currency:string;costMicros:number;occurredAt:string}
export interface AutomationControlView{id:string;workspaceId:string;brandId:string;automationKey:string;stage:OperationsStage;status:"enabled"|"disabled";version:number;createdAt:string;disabledAt?:string;disabledBy?:string;disabledReason?:string}
export interface InterventionView{id:string;workspaceId:string;brandId:string;actorType:"operator";actorId:string;action:"retry-requested"|"automation-disabled"|"content-withdrawn"|"configuration-corrected"|"safety-reviewed";targetType:string;targetId:string;reason:string;at:string;relatedFailureId?:string}
export interface RetryRequestView{id:string;workspaceId:string;brandId:string;workflowId:string;failureId:string;attempt:number;idempotencyKey:string;requestedBy:string;requestedAt:string}
export interface OperationsSummaryView{brandId:string;failures:OperationalFailureView[];budgets:OperationsBudgetView[];costs:OperationsCostView[];automations:AutomationControlView[];interventions:InterventionView[]}

async function body<T>(response:Response|null,fallback:string):Promise<T>{
  if(!response)throw new KairoApiError("Authentication is required",401);
  if(!response.ok){const data=(await response.json().catch(()=>null))as{detail?:string}|null;throw new KairoApiError(data?.detail??fallback,response.status)}
  return response.json()as Promise<T>;
}

export function getOperations(brandId:string):Promise<OperationsSummaryView>{return body(kairoServerFetch(`/api/v1/internal/brands/${encodeURIComponent(brandId)}/operations`),"Unable to load Pilot Operations")}
export function requestOperationsRetry(brandId:string,failureId:string,idempotencyKey:string):Promise<RetryRequestView>{return body(kairoServerFetch(`/api/v1/internal/brands/${encodeURIComponent(brandId)}/operations/failures/${encodeURIComponent(failureId)}/retry`,{method:"POST",body:JSON.stringify({idempotencyKey,requestedAt:new Date().toISOString()})}),"Unable to retry operation")}
export function disableOperationsAutomation(brandId:string,automationKey:string,expectedVersion:number,reason:string):Promise<AutomationControlView>{return body(kairoServerFetch(`/api/v1/internal/brands/${encodeURIComponent(brandId)}/operations/automations/${encodeURIComponent(automationKey)}/disable`,{method:"POST",body:JSON.stringify({expectedVersion,reason,at:new Date().toISOString()})}),"Unable to disable automation")}
