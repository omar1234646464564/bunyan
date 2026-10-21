import { PrismaClient } from "@prisma/client";

// The Vercel Postgres/Neon integration exposes POSTGRES_* variables rather than
// DATABASE_URL. Normalize them so Prisma (which reads DATABASE_URL) works without
// extra manual configuration.
if (!process.env.DATABASE_URL) {
  const fallback =
    process.env.POSTGRES_PRISMA_URL ??
    process.env.POSTGRES_URL ??
    process.env.POSTGRES_URL_NON_POOLING;
  if (fallback) process.env.DATABASE_URL = fallback;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
