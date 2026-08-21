import { BUILT_RELEASE_SHA } from "../../../src/lib/generated-release-sha";

export const dynamic = "force-dynamic";

const SHA_PATTERN = /^[0-9a-f]{40}$/i;

function resolveReleaseSha(): string {
  const candidates = [
    process.env.VERCEL_GIT_COMMIT_SHA,
    process.env.KAIRO_RELEASE_SHA,
    BUILT_RELEASE_SHA,
  ];

  for (const candidate of candidates) {
    const value = candidate?.trim() ?? "";
    if (SHA_PATTERN.test(value)) return value;
  }

  return "";
}

export function GET(): Response {
  const releaseSha = resolveReleaseSha();
  if (!releaseSha) {
    return Response.json(
      { status: "unknown", releaseSha: null },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }

  return Response.json(
    { status: "ok", releaseSha },
    { headers: { "cache-control": "no-store" } },
  );
}
