import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const email = process.env.ADMIN_EMAIL ?? "admin@bunyan.sa";
const password = process.env.ADMIN_PASSWORD ?? "Admin@12345";
const name = process.env.ADMIN_NAME ?? "مدير النظام";

async function main() {
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: "ADMIN", name },
    create: {
      name,
      email,
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log("Admin ready:");
  console.log(`  email:    ${admin.email}`);
  console.log(`  password: ${password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
