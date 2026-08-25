import type{FastifyInstance,FastifyReply,FastifyRequest}from"fastify";
import{KairoService,type KairoRepository}from"@kairo/domain";
import type{IdentityVerifier}from"./auth";
import{SimpleCreationService,type StartSimpleCreationInput}from"./simple-creation";
import type{BeginHomeMediaUploadInput}from"./home-media";

export function registerSimpleCreationRoutes(app:FastifyInstance,d:{coreStore:KairoRepository;identityVerifier:IdentityVerifier;service:SimpleCreationService;trigger?:()=>void}){
 const core=new KairoService(d.coreStore);
 app.post<{Params:{brandId:string};Body:StartSimpleCreationInput}>("/api/v1/brands/:brandId/simple-creations",async(q,r)=>{const a=await auth(q,r,core,d.identityVerifier);if(!a)return;const b=await core.getBrand(a.id,q.params.brandId);const value=await d.service.start(a.id,b.workspaceId,b.id,q.body);d.trigger?.();return r.status(202).send(await d.service.get(a.id,b.id,value.id));});
 app.get<{Params:{brandId:string;creationId:string}}>("/api/v1/brands/:brandId/simple-creations/:creationId",async(q,r)=>{const a=await auth(q,r,core,d.identityVerifier);if(!a)return;return d.service.get(a.id,q.params.brandId,q.params.creationId);});

 app.get<{Params:{brandId:string}}>("/api/v1/brands/:brandId/home-media",async(q,r)=>{const a=await auth(q,r,core,d.identityVerifier);if(!a)return;const b=await core.getBrand(a.id,q.params.brandId);if(!mediaReady(d.service,q,r))return;return d.service.listHomeMedia(a.id,b.id);});
 app.post<{Params:{brandId:string};Body:BeginHomeMediaUploadInput}>("/api/v1/brands/:brandId/home-media/uploads",async(q,r)=>{const a=await auth(q,r,core,d.identityVerifier);if(!a)return;const b=await core.getBrand(a.id,q.params.brandId);if(!mediaReady(d.service,q,r))return;return r.status(201).send(await d.service.beginHomeMediaUpload(a.id,b.workspaceId,b.id,q.body));});
 app.post<{Params:{brandId:string;uploadId:string}}>("/api/v1/brands/:brandId/home-media/uploads/:uploadId/complete",async(q,r)=>{const a=await auth(q,r,core,d.identityVerifier);if(!a)return;const b=await core.getBrand(a.id,q.params.brandId);if(!mediaReady(d.service,q,r))return;return d.service.completeHomeMediaUpload(a.id,b.id,q.params.uploadId);});
}

function mediaReady(service:SimpleCreationService,q:FastifyRequest,r:FastifyReply){
 let ready=false;
 try{ready=service.homeMediaConfigured();}catch{ready=false;}
 if(ready)return true;
 void r.status(503).send({type:"about:blank",title:"Media storage unavailable",status:503,detail:"Private media storage is not configured for this environment.",code:"media-storage-unavailable",correlationId:q.id});
 return false;
}

async function auth(q:FastifyRequest,r:FastifyReply,s:KairoService,v:IdentityVerifier){const i=await v.verify(q.headers.authorization);if(!i){await r.status(401).send({title:"Unauthorized",status:401,code:"unauthorized",correlationId:q.id});return null;}return s.establishSession(i);}
