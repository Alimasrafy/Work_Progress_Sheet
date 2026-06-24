import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { toNumber, apiError } from "@/lib/utils/api";

export async function GET() {
  try {
    const session = await requireSession();
    const users = await prisma.user.findMany({
      where:
        session.user.role === UserRole.ADMIN
          ? undefined
          : {
              id: session.user.id
            },
      include: {
        projects: {
          where: { archivedAt: null }
        }
      },
      orderBy: { name: "asc" }
    });

    return NextResponse.json(
      users.map((user) => {
        const revenue = { USD: 0, EUR: 0 };
        const workerPay = { USD: 0, EUR: 0 };
        const ownerCut = { USD: 0, EUR: 0 };
        const withdrawn = { USD: 0, EUR: 0 };
        for (const project of user.projects) {
          revenue[project.paymentCurrency] += toNumber(project.paymentAmount);
          workerPay[project.paymentCurrency] += toNumber(project.workerPayAmount);
          ownerCut[project.paymentCurrency] += toNumber(project.ownerCutAmount);
          withdrawn[project.paymentCurrency] += toNumber(project.withdrawnAmount);
        }

        return {
          id: user.id,
          name: user.name,
          role: user.role,
          projects: user.projects.length,
          invoices: user.projects.filter((project) => project.invoice).length,
          pending: user.projects.filter((project) => project.paymentStatus === "PENDING")
            .length,
          revenue,
          workerPay,
          ownerCut,
          withdrawn,
          remaining: {
            USD: revenue.USD - withdrawn.USD,
            EUR: revenue.EUR - withdrawn.EUR
          }
        };
      })
    );
  } catch (error) {
    return apiError(error);
  }
}
