import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

/**
 * Creates or updates the admin account when ADMIN_EMAIL and ADMIN_PASSWORD are
 * set. No-op otherwise. Used by the production start script and the deploy step.
 */
export async function ensureAdmin() {
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
    console.log(`[ensure-admin] admin account ensured: ${email}`);
  } finally {
    await prisma.$disconnect();
  }
}
