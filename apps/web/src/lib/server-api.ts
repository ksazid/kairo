import "server-only";
import { cookies } from "next/headers";

/** First-party server-side transport from Kairo Web to Kairo API. */
export async function kairoServerFetch(path:string,init?:RequestInit):Promise<Response|null>{
  const accessToken=(await cookies()).get("kairo_access_token")?.value;
  if(!accessToken)return null;
  const base=(process.env.KAIRO_API_URL??"http://127.0.0.1:4000").replace(/\/$/,"");
  return fetch(`${base}${path}`,{...init,cache:"no-store",headers:{...(init?.headers??{}),"content-type":"application/json",authorization:`Bearer ${accessToken}`}});
}
