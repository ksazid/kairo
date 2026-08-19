import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { Client } from "pg";

const range = process.env.KAIRO_STARTUP_MIGRATION_RANGE?.trim();
if (!range) throw new Error("KAIRO_STARTUP_MIGRATION_RANGE is required");

const parts = range.split("..");
if (parts.length !== 2) throw new Error("KAIRO_STARTUP_MIGRATION_RANGE must be <from>..<to>");
const [from, to] = parts;
if (!/^\d{4}_.+\.sql$/.test(from) || !/^\d{4}_.+\.sql$/.test(to)) {
  throw new Error("KAIRO_STARTUP_MIGRATION_RANGE must contain migration filenames");
}

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const directory = new URL("../apps/api/migrations/", import.meta.url);
const files = (await readdir(directory)).filter((name) => /^\d{4}_.+\.sql$/.test(name)).sort();
const fromIndex = files.indexOf(from);
const toIndex = files.indexOf(to);
if (fromIndex < 0 || toIndex < 0 || fromIndex > toIndex) throw new Error(`Unknown or invalid migration range: ${range}`);
if (toIndex !== files.length - 1) throw new Error(`Migration range must end at the latest repository migration: ${to}`);

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
    await client.query("select pg_advisory_xact_lock(hashtext($1))", ["kairo-migration-range"]);

    const registry = await client.query("select to_regclass('public.kairo_schema_migrations') as registry");
    if (!registry.rows[0]?.registry) throw new Error("kairo_schema_migrations registry is missing");

    const appliedRows = await client.query("select filename, checksum from kairo_schema_migrations");
    const applied = new Map(appliedRows.rows.map((row) => [row.filename, row.checksum]));

    for (const filename of files.slice(0, fromIndex)) {
      const expected = metadata.get(filename)?.checksum;
      const actual = applied.get(filename);
      if (!actual) throw new Error(`Prerequisite migration is missing: ${filename}`);
      if (actual !== expected) throw new Error(`Applied migration changed: ${filename}`);
    }

    const rangeFiles = files.slice(fromIndex, toIndex + 1);
    let missingSeen = false;
    for (const filename of rangeFiles) {
      const expected = metadata.get(filename)?.checksum;
      const actual = applied.get(filename);
      if (!actual) {
        missingSeen = true;
        continue;
      }
      if (actual !== expected) throw new Error(`Applied migration changed: ${filename}`);
      if (missingSeen) throw new Error(`Out-of-order applied migration detected: ${filename}`);
    }

    const missing = rangeFiles.filter((filename) => !applied.has(filename));
    if (!missing.length) {
      await client.query("commit");
      console.log(`already applied range ${range}`);
    } else {
      for (const filename of missing) {
        const entry = metadata.get(filename);
        if (!entry) throw new Error(`Migration metadata missing: ${filename}`);
        const body = entry.source.replace(/^\s*begin;\s*/i, "").replace(/\s*commit;\s*$/i, "");
        await client.query(body);
        await client.query("insert into kairo_schema_migrations(filename,checksum) values($1,$2)", [filename, entry.checksum]);
        console.log(`applied ${filename}`);
      }
      await client.query("commit");
      console.log(`applied range ${range}`);
    }
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
} finally {
  await client.end();
}
