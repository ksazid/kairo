import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const lock = readFileSync("package-lock.json");
const expected = readFileSync("deployment/dependency-lock.sha256", "utf8").trim().toLowerCase();
const actual = createHash("sha256").update(lock).digest("hex");

if (!/^[0-9a-f]{64}$/.test(expected)) {
  console.error("deployment/dependency-lock.sha256 must contain exactly one SHA-256 digest");
  process.exit(1);
}

if (actual !== expected) {
  console.error(`package-lock.json digest mismatch: expected ${expected}, got ${actual}`);
  process.exit(1);
}

console.log(`package-lock.json digest verified: ${actual}`);
