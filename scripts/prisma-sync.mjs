import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { ensureAdmin } from "./ensure-admin.mjs";

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// Load .env so local runs pick up DATABASE_URL (Vercel/CI provide it directly).
loadEnvFile(".env");

// Accept the variable names used by the Vercel Postgres / Neon integration.
if (!process.env.DATABASE_URL) {
  const fallback =
    process.env.POSTGRES_PRISMA_URL ??
    process.env.POSTGRES_URL ??
    process.env.POSTGRES_URL_NON_POOLING;
  if (fallback) process.env.DATABASE_URL = fallback;
}
if (!process.env.DIRECT_URL && process.env.POSTGRES_URL_NON_POOLING) {
  process.env.DIRECT_URL = process.env.POSTGRES_URL_NON_POOLING;
}

const url = process.env.DATABASE_URL ?? "";
const isPostgres = /^postgres(ql)?:\/\//i.test(url);
const shouldPush = process.argv.includes("--push");

const baseSchema = "prisma/schema.prisma";
let schemaPath = baseSchema;

// Prisma's provider is baked into the schema, so when a Postgres URL is present
// we derive a Postgres copy of the schema. Models are identical (String/Float
// only), so swapping the provider is sufficient.
if (isPostgres) {
  const schema = readFileSync(baseSchema, "utf8").replace(
    /provider\s*=\s*"sqlite"/,
    'provider = "postgresql"',
  );
  schemaPath = "prisma/schema.generated.prisma";
  writeFileSync(schemaPath, schema);
}

console.log(
  `[prisma-sync] provider=${isPostgres ? "postgresql" : "sqlite"} schema=${schemaPath}`,
);

const onVercel = Boolean(process.env.VERCEL);
if (onVercel && shouldPush && !isPostgres) {
  console.error(
    "[prisma-sync] DATABASE_URL must be a postgres:// URL on Vercel. " +
      "SQLite has no persistent disk there, so the deploy would crash at runtime. " +
      "Set DATABASE_URL (Postgres) in the Vercel project's environment variables.",
  );
  process.exit(1);
}

run("npx", ["--no-install", "prisma", "generate", "--schema", schemaPath]);

if (shouldPush && url) {
  // Managed Postgres providers (Neon, Supabase, Vercel Postgres) expose a pooled
  // URL for the app and a direct URL for schema changes (DDL). Prefer DIRECT_URL
  // for `db push` when available.
  if (process.env.DIRECT_URL) process.env.DATABASE_URL = process.env.DIRECT_URL;
  run("npx", [
    "--no-install",
    "prisma",
    "db",
    "push",
    "--schema",
    schemaPath,
    "--skip-generate",
  ]);
  await ensureAdmin();
}
