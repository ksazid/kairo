import { rmSync } from "node:fs";
import { build } from "esbuild";

const output = new URL("../apps/api/dist", import.meta.url);
rmSync(output, { recursive: true, force: true });

await build({
  entryPoints: [new URL("../apps/api/src/server.ts", import.meta.url).pathname],
  outfile: new URL("../apps/api/dist/server.js", import.meta.url).pathname,
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node24",
  sourcemap: true,
  minify: false,
  external: ["fastify", "jose", "pg"],
  logLevel: "info"
});
