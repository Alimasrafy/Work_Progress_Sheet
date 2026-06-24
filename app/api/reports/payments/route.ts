import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { scopeProjectWhere } from "@/lib/permissions/projects";
import { apiError, toNumber } from "@/lib/utils/api";

export async function GET() {
  try {
    const session = await requireSession();
    const projects = await prisma.project.findMany({
      where: scopeProjectWhere(session),
      include: { assignedUser: { select: { name: true } } },
      orderBy: [{ paymentStatus: "asc" }, { workAssignDate: "desc" }]
    });

    return NextResponse.json(
      projects.map((project) => {
        const paymentAmount = toNumber(project.paymentAmount);
        const workerPayAmount = toNumber(project.workerPayAmount);
        const ownerCutAmount = toNumber(project.ownerCutAmount);
        const withdrawnAmount = toNumber(project.withdrawnAmount);
        return {
          id: project.id,
          worker: project.assignedUser.name,
          workAssignDate: project.workAssignDate,
          paymentAmount,
          paymentCurrency: project.paymentCurrency,
          workerPayAmount,
          ownerCutAmount,
          withdrawnAmount,
          remainingAmount: paymentAmount - withdrawnAmount,
          paymentStatus: project.paymentStatus,
          withdrawStatus: project.withdrawStatus,
          payPlatform: project.payPlatform
        };
      })
    );
  } catch (error) {
    return apiError(error);
  }
}
