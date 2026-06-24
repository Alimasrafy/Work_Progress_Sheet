import { readFile } from "node:fs/promises";

import { prisma } from "../lib/db/prisma";
import { importSpreadsheet } from "../lib/import/spreadsheet";

async function main() {
  const workbookPath =
    process.env.IMPORT_WORKBOOK_PATH ??
    "/Users/alimasrafijoy/Downloads/Copy of Fazio_Work_list_by_Dario_.xlsx";

  const admin = await prisma.user.findFirst({
    where: {
      role: "ADMIN"
    },
    select: {
      id: true
    }
  });

  if (!admin) {
    throw new Error("Admin user not found. Run the seed script first.");
  }

  const fileBuffer = await readFile(workbookPath);
  const result = await importSpreadsheet({
    fileBuffer,
    actorUserId: admin.id
  });

  console.log(
    JSON.stringify(
      {
        workbookPath,
        ...result
      },
      null,
      2
    )
  );
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
