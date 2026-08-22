import { readFileSync } from "node:fs";
import { describe,expect,it } from "vitest";
const source=(relative:string)=>readFileSync(new URL(relative,import.meta.url),"utf8");

describe("VS-76 Meta connection web flow",()=>{
  it("centralizes all Meta API operations behind authenticated server calls",()=>{const api=source("./lib/meta-connection-api.ts");for(const path of ["/channels/meta/${encodeURIComponent(mode)}/connect","/channels/meta/${encodeURIComponent(mode)}/callback","/channels/meta/intents/${encodeURIComponent(intentId)}/candidates","/channels/meta/health","/disconnect"])expect(api).toContain(path);expect(api).toContain('cookies()).get("kairo_access_token")')});
  it("stores only a short-lived Brand-bounded return and resumes direct or Facebook callbacks",()=>{const start=source("../app/brands/[brandId]/connect/[mode]/start/route.ts"),callback=source("../app/channels/meta/[mode]/callback/route.ts");expect(start).toContain("safeBrandReturnTo");expect(start).toContain("httpOnly:true");expect(start).toContain("maxAge:600");expect(callback).toContain("safeStoredBrandReturn");expect(callback).toContain('result.status==="selection-required"');expect(callback).toContain("/connections/select")});
  it("keeps multi-account selection explicit and skippable",()=>{const page=source("../app/brands/[brandId]/connections/select/page.tsx");expect(page).toContain("Nothing is connected until you choose");expect(page).toContain("Connect this account");expect(page).toContain("Skip this connection")});
});
