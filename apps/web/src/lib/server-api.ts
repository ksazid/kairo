import "server-only";
import { authorizedFetch } from "./kairo-api";

/** First-party server-side transport from Kairo Web to Kairo API. */
export async function kairoServerFetch(path:string,init?:RequestInit):Promise<Response|null>{
  return authorizedFetch(path,init);
}
