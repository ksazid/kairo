import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { Client } from "pg";

const target = process.env.KAIRO_STARTUP_MIGRATION?.trim();
if (!target) throw new Error("KAIRO_STARTUP_MIGRATION is required");
if (!/^\d{4}_.+\.sql$/.test(target)) throw new Error("KAIRO_STARTUP_MIGRATION must be a migration filename");

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const directory = new URL("../apps/api/migrations/", import.meta.url);
const files = (await readdir(directory)).filter((name) => /^\d{4}_.+\.sql$/.test(name)).sort();
const targetIndex = files.indexOf(target);
if (targetIndex < 0) throw new Error(`Unknown migration: ${target}`);
if (targetIndex !== files.length - 1) throw new Error(`Exact migration must be the latest migration: ${target}`);

const metadata = new Map();
for (const filename of files) {
  const source = await readFile(new URL(filename, directory), "utf8");
  metadata.set(filename, {
    source,
    checksum: createHash("sha256").update(source).digest("hex"),
  });
}

const client = new Client({ connectionString: databaseUrl });
await client.connect();

try {
  await client.query("begin");
  try {
    await client.query("select pg_advisory_xact_lock(hashtext($1))", ["kairo-exact-migration"]);

    const registry = await client.query("select to_regclass('public.kairo_schema_migrations') as registry");
    if (!registry.rows[0]?.registry) throw new Error("kairo_schema_migrations registry is missing");

    const appliedRows = await client.query("select filename, checksum from kairo_schema_migrations");
    const applied = new Map(appliedRows.rows.map((row) => [row.filename, row.checksum]));

    for (const filename of files.slice(0, targetIndex)) {
      const expected = metadata.get(filename)?.checksum;
      const actual = applied.get(filename);
      if (!actual) throw new Error(`Prior migration is missing: ${filename}`);
      if (actual !== expected) throw new Error(`Applied migration changed: ${filename}`);
    }

    const targetMetadata = metadata.get(target);
    if (!targetMetadata) throw new Error(`Migration metadata missing: ${target}`);

    const existingTargetChecksum = applied.get(target);
    if (existingTargetChecksum) {
      if (existingTargetChecksum !== targetMetadata.checksum) throw new Error(`Applied migration changed: ${target}`);
      await client.query("commit");
      console.log(`already applied ${target}`);
    } else {
      const body = targetMetadata.source.replace(/^\s*begin;\s*/i, "").replace(/\s*commit;\s*$/i, "");
      await client.query(body);
      await client.query("insert into kairo_schema_migrations(filename,checksum) values($1,$2)", [target, targetMetadata.checksum]);
      await client.query("commit");
      console.log(`applied ${target}`);
    }
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
} finally {
  await client.end();
}
