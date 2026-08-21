import { execFileSync } from "node:child_process";

export const dynamic = "force-static";

function buildSourceSha(): string {
  const configured = (process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.KAIRO_RELEASE_SHA ?? "").trim();
  if (/^[0-9a-f]{40}$/i.test(configured)) return configured;
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

export function GET(): Response {
  const releaseSha = buildSourceSha();
  if (!/^[0-9a-f]{40}$/i.test(releaseSha)) {
    return Response.json({ status: "unknown", releaseSha: null }, { status: 503, headers: { "cache-control": "no-store" } });
  }
  return Response.json(
    { status: "ok", releaseSha },
    { headers: { "cache-control": "public, max-age=0, must-revalidate" } },
  );
}
