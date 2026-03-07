import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {

  const hashedPassword = await bcrypt.hash("admin123", 10);

  await prisma.doctor.upsert({
    where: {
      email: "admin@mediflow.com"
    },
    update: {},
    create: {
      email: "admin@mediflow.com",
      password: hashedPassword,
      name: "Admin",
      specialization: "System",
      department: "ADMIN",
      role: "ADMIN"
    }
  });

  console.log("✅ Admin doctor created (without affecting other doctors)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });