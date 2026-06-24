import { PrismaClient, UserRole, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function upsertUser(input: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}) {
  const passwordHash = await bcrypt.hash(input.password, 12);

  return prisma.user.upsert({
    where: { email: input.email },
    update: {
      name: input.name,
      passwordHash,
      role: input.role,
      status: UserStatus.ACTIVE
    },
    create: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
      status: UserStatus.ACTIVE
    }
  });
}

async function main() {
  await upsertUser({
    name: "Ali Masrafi",
    email: process.env.INITIAL_ADMIN_EMAIL ?? "ali@example.com",
    password: process.env.INITIAL_ADMIN_PASSWORD ?? "change-this-password",
    role: UserRole.ADMIN
  });

  await upsertUser({
    name: "Sayed Sonet",
    email: process.env.SONET_EMAIL ?? "sonet@example.com",
    password: process.env.SONET_PASSWORD ?? "change-this-password",
    role: UserRole.TEAM_MEMBER
  });

  await prisma.setting.upsert({
    where: { key: "import.spreadsheetSource" },
    update: { value: { workbook: "Copy of Fazio_Work_list_by_Dario_.xlsx" } },
    create: {
      key: "import.spreadsheetSource",
      value: { workbook: "Copy of Fazio_Work_list_by_Dario_.xlsx" }
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
