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
run("npx", ["--no-install", "prisma", "generate", "--schema", schemaPath]);

if (shouldPush && url) {
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
