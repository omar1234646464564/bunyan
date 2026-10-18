import { spawnSync } from "node:child_process";
import { ensureAdmin } from "./ensure-admin.mjs";

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("[start] syncing database schema...");
run("npx", ["--no-install", "prisma", "db", "push", "--skip-generate"]);

await ensureAdmin();

console.log("[start] starting Next.js server...");
run("npx", ["--no-install", "next", "start", "-p", process.env.PORT ?? "3000"]);
