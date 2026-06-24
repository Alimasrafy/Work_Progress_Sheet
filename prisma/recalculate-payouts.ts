import { Prisma } from "@prisma/client";

import { prisma } from "../lib/db/prisma";
import { calculateProjectPayout } from "../lib/payments/payout";
import { toNumber } from "../lib/utils/api";

async function main() {
  const projects = await prisma.project.findMany({
    include: {
      assignedUser: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      workAssignDate: "asc"
    }
  });

  let updated = 0;

  for (const project of projects) {
    const payout = calculateProjectPayout({
      workerName: project.assignedUser.name,
      workAssignDate: project.workAssignDate,
      paymentAmount: toNumber(project.paymentAmount),
      paymentCurrency: project.paymentCurrency
    });

    const currentWorkerPay = toNumber(project.workerPayAmount);
    const currentOwnerCut = toNumber(project.ownerCutAmount);

    if (
      currentWorkerPay === payout.workerPayAmount &&
      currentOwnerCut === payout.ownerCutAmount
    ) {
      continue;
    }

    await prisma.project.update({
      where: { id: project.id },
      data: {
        workerPayAmount: new Prisma.Decimal(payout.workerPayAmount),
        ownerCutAmount: new Prisma.Decimal(payout.ownerCutAmount)
      }
    });
    updated += 1;
  }

  console.log(`Recalculated payouts for ${updated} of ${projects.length} projects.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
