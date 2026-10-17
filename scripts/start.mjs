import { spawnSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: true });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function ensureAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;

  const prisma = new PrismaClient();
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.upsert({
      where: { email },
      update: { passwordHash, role: "ADMIN" },
      create: {
        name: process.env.ADMIN_NAME ?? "مدير النظام",
        email,
        passwordHash,
        role: "ADMIN",
      },
    });
    console.log(`[start] admin account ensured: ${email}`);
  } finally {
    await prisma.$disconnect();
  }
}

console.log("[start] syncing database schema...");
run("npx", ["--no-install", "prisma", "db", "push", "--skip-generate"]);

await ensureAdmin();

console.log("[start] starting Next.js server...");
run("npx", ["--no-install", "next", "start", "-p", process.env.PORT ?? "3000"]);
