import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
let releaseSha = (process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.KAIRO_RELEASE_SHA ?? process.env.GITHUB_SHA ?? "").trim();

if (!/^[0-9a-f]{40}$/i.test(releaseSha)) {
  try {
    releaseSha = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: resolve(here, "../../.."),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    releaseSha = "";
  }
}

if (!/^[0-9a-f]{40}$/i.test(releaseSha)) {
  throw new Error("Unable to resolve an exact 40-character web release SHA");
}

writeFileSync(
  resolve(here, "../src/lib/generated-release-sha.ts"),
  `// Generated immediately before build; do not edit.\nexport const BUILT_RELEASE_SHA = ${JSON.stringify(releaseSha)};\n`,
  "utf8",
);

console.log(`web release provenance: ${releaseSha}`);
