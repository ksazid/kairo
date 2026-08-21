// VS-73 release marker: keep production web deployment bound to an affected app path.
export const dynamic = "force-dynamic";

export function GET(): Response {
  const releaseSha = (process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.KAIRO_RELEASE_SHA ?? "").trim();
  if (!/^[0-9a-f]{40}$/i.test(releaseSha)) {
    return Response.json({ status: "unknown", releaseSha: null }, { status: 503, headers: { "cache-control": "no-store" } });
  }
  return Response.json({ status: "ok", releaseSha }, { headers: { "cache-control": "no-store" } });
}
