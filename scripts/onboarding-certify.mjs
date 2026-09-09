import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

const commands = [
  ["API onboarding extraction matrix", ["run", "test", "--workspace", "@kairo/api", "--", "src/onboarding-url-certification.test.ts", "src/public-brand-reference.test.ts", "src/source-adapters.test.ts", "src/source-intelligence.test.ts"]],
  ["Domain sanitation and Brand Brain gates", ["run", "test", "--workspace", "@kairo/domain", "--", "src/brand-brain-evidence-sanitizer.test.ts", "src/brand-brain-evidence-boundary.test.ts", "src/brand-brain-sanitizing-reader.test.ts", "src/brand-brain-bootstrap.test.ts", "src/brand-dna-readiness.test.ts", "src/brand-brain-write-gate.test.ts"]],
  ["Full typecheck, tests, and production builds", ["run", "runtime:verify"]],
  ["Governance and repository preflight", ["run", "preflight"]],
];

for (const [label, args] of commands) {
  console.log(`\n[onboarding:certify] ${label}`);
  const result = spawnSync(npm, args, { cwd: root, stdio: "inherit" });
  if (result.error) {
    console.error(`[onboarding:certify] ${label} failed to start: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`[onboarding:certify] ${label} failed with exit code ${result.status ?? "unknown"}`);
    process.exit(result.status ?? 1);
  }
}

console.log("\n[onboarding:certify] PASS — URL matrix, extraction, sanitation, provenance, typecheck, builds, and preflight are green.");
