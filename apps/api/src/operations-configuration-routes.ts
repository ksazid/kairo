import{randomUUID}from"node:crypto";
import type{FastifyInstance,FastifyReply,FastifyRequest}from"fastify";
import type{AccountDto,ExternalIdentity,ProblemDetails}from"@kairo/contracts";
import{KairoService,ResourceNotFoundError,type KairoRepository}from"@kairo/domain";
import{createAutomationControl,createWorkflowBudget,type WorkflowStage}from"@kairo/domain/operations";
import type{IdentityVerifier}from"./auth";
import type{OperationsStore}from"./operations-store";

export interface OperationsConfigurationRouteOptions{store:OperationsStore;coreStore:KairoRepository;identityVerifier:IdentityVerifier}

export function registerOperationsConfigurationRoutes(app:FastifyInstance,options:OperationsConfigurationRouteOptions){
 const service=new KairoService(options.coreStore);
 app.post<{Params:{brandId:string};Body:{workflowId:string;currency:string;limitMicros:number}}>("/api/v1/internal/brands/:brandId/operations/budgets",async(request,reply)=>{
  const account=await authenticate(request,reply,service,options.identityVerifier);if(!account)return;
  const brand=await options.coreStore.getBrandForAccount(account.id,request.params.brandId);if(!brand)throw new ResourceNotFoundError("Pilot operations not found");
  return options.store.createBudget(account.id,createWorkflowBudget({id:randomUUID(),workspaceId:brand.workspaceId,brandId:brand.id,workflowId:request.body?.workflowId??"",currency:request.body?.currency??"",limitMicros:request.body?.limitMicros??0,createdAt:new Date().toISOString()}));
 });
 app.post<{Params:{brandId:string};Body:{automationKey:string;stage:WorkflowStage}}>("/api/v1/internal/brands/:brandId/operations/automations",async(request,reply)=>{
  const account=await authenticate(request,reply,service,options.identityVerifier);if(!account)return;
  const brand=await options.coreStore.getBrandForAccount(account.id,request.params.brandId);if(!brand)throw new ResourceNotFoundError("Pilot operations not found");
  return options.store.createAutomationControl(account.id,createAutomationControl({id:randomUUID(),workspaceId:brand.workspaceId,brandId:brand.id,automationKey:request.body?.automationKey??"",stage:request.body?.stage as WorkflowStage,createdAt:new Date().toISOString()}));
 });
}

async function authenticate(request:FastifyRequest,reply:FastifyReply,service:KairoService,verifier:IdentityVerifier):Promise<AccountDto|null>{const identity:ExternalIdentity|null=await verifier.verify(request.headers.authorization);if(!identity){await reply.status(401).send(problem(401,"Unauthorized","A valid bearer token is required.","unauthorized",request.id));return null}return service.establishSession(identity)}
function problem(status:number,title:string,detail:string,code:string,correlationId:string):ProblemDetails{return{type:`https://kairo.local/problems/${code}`,title,status,detail,code,correlationId}}
