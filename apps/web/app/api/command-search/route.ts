import {NextResponse} from "next/server";
import {searchCommands} from "../../../src/lib/kairo-api";
export async function GET(request:Request){const url=new URL(request.url),q=url.searchParams.get("q")?.trim()??"",brandId=url.searchParams.get("brandId")?.trim()||undefined;if(q.length<2)return NextResponse.json({query:q,scope:brandId?{brandId}:{},results:[]});try{return NextResponse.json(await searchCommands(q,{...(brandId?{brandId}:{}),limit:12}))}catch{return NextResponse.json({query:q,scope:brandId?{brandId}:{},results:[]},{status:200})}}
