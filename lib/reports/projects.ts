import { PaymentCurrency, PaymentStatus, UserRole, WorkStatus } from "@prisma/client";
import type { Session } from "next-auth";

import { prisma } from "@/lib/db/prisma";
import { scopeProjectWhere } from "@/lib/permissions/projects";
import { toNumber } from "@/lib/utils/api";

export function emptyCurrencyTotals() {
  return {
    USD: 0,
    EUR: 0
  };
}

export function monthRange(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start, end };
}

export async function getDashboardSummary(
  session: Session,
  userId?: string,
  ignoreRoleRestrictions = false
) {
  const where = ignoreRoleRestrictions
    ? { archivedAt: null, ...(userId ? { assignedUserId: userId } : {}) }
    : {
        ...scopeProjectWhere(session),
        ...(userId && session.user.role === UserRole.ADMIN ? { assignedUserId: userId } : {})
      };

  const projects = await prisma.project.findMany({
    where,
    select: {
      paymentAmount: true,
      paymentCurrency: true,
      workerPayAmount: true,
      ownerCutAmount: true,
      withdrawnAmount: true,
      workStatus: true,
      paymentStatus: true,
      invoice: true
    }
  });

  const revenue = emptyCurrencyTotals();
  const workerPay = emptyCurrencyTotals();
  const ownerCut = emptyCurrencyTotals();
  const withdrawn = emptyCurrencyTotals();

  for (const project of projects) {
    const currency = project.paymentCurrency as PaymentCurrency;
    revenue[currency] += toNumber(project.paymentAmount);
    workerPay[currency] += toNumber(project.workerPayAmount);
    ownerCut[currency] += toNumber(project.ownerCutAmount);
    withdrawn[currency] += toNumber(project.withdrawnAmount);
  }

  return {
    totalProjects: projects.length,
    totalDelivered: projects.filter((project) => project.workStatus === WorkStatus.DELIVERED)
      .length,
    totalPending: projects.filter((project) => project.paymentStatus === PaymentStatus.PENDING)
      .length,
    totalInvoices: projects.filter((project) => Boolean(project.invoice)).length,
    revenue,
    workerPay,
    ownerCut,
    withdrawn,
    remaining: {
      USD: revenue.USD - withdrawn.USD,
      EUR: revenue.EUR - withdrawn.EUR
    }
  };
}

export async function getMonthlySummary(
  session: Session,
  input: { year: number; month: number; userId?: string }
) {
  const { start, end } = monthRange(input.year, input.month);
  const where = {
    ...scopeProjectWhere(session),
    workAssignDate: {
      gte: start,
      lt: end
    },
    ...(input.userId && session.user.role === UserRole.ADMIN
      ? { assignedUserId: input.userId }
      : {})
  };

  const [summary, projects] = await Promise.all([
    getDashboardSummary(session, input.userId),
    prisma.project.findMany({
      where,
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        workAssignDate: "asc"
      }
    })
  ]);

  const monthRevenue = emptyCurrencyTotals();
  const monthWorkerPay = emptyCurrencyTotals();
  const monthOwnerCut = emptyCurrencyTotals();
  const monthWithdrawn = emptyCurrencyTotals();

  for (const project of projects) {
    monthRevenue[project.paymentCurrency] += toNumber(project.paymentAmount);
    monthWorkerPay[project.paymentCurrency] += toNumber(project.workerPayAmount);
    monthOwnerCut[project.paymentCurrency] += toNumber(project.ownerCutAmount);
    monthWithdrawn[project.paymentCurrency] += toNumber(project.withdrawnAmount);
  }

  return {
    summary,
    month: {
      totalProjects: projects.length,
      totalDelivered: projects.filter((project) => project.workStatus === WorkStatus.DELIVERED)
        .length,
      totalPending: projects.filter((project) => project.paymentStatus === PaymentStatus.PENDING)
        .length,
      totalInvoices: projects.filter((project) => Boolean(project.invoice)).length,
      revenue: monthRevenue,
      workerPay: monthWorkerPay,
      ownerCut: monthOwnerCut,
      withdrawn: monthWithdrawn,
      remaining: {
        USD: monthRevenue.USD - monthWithdrawn.USD,
        EUR: monthRevenue.EUR - monthWithdrawn.EUR
      }
    },
    projects
  };
}

export async function getMonthBuckets(
  session: Session,
  userId?: string,
  ignoreRoleRestrictions = false
) {
  const where = ignoreRoleRestrictions
    ? { archivedAt: null, ...(userId ? { assignedUserId: userId } : {}) }
    : {
        ...scopeProjectWhere(session),
        ...(userId && session.user.role === UserRole.ADMIN ? { assignedUserId: userId } : {})
      };

  const projects = await prisma.project.findMany({
    where,
    select: {
      workAssignDate: true,
      paymentAmount: true,
      paymentCurrency: true,
      paymentStatus: true,
      workerPayAmount: true,
      ownerCutAmount: true,
      withdrawnAmount: true,
      invoice: true
    },
    orderBy: {
      workAssignDate: "asc"
    }
  });

  const buckets = new Map<
    string,
    {
      year: number;
      month: number;
      projects: number;
      pending: number;
      invoices: number;
      revenue: ReturnType<typeof emptyCurrencyTotals>;
      workerPay: ReturnType<typeof emptyCurrencyTotals>;
      ownerCut: ReturnType<typeof emptyCurrencyTotals>;
      withdrawn: ReturnType<typeof emptyCurrencyTotals>;
    }
  >();

  for (const project of projects) {
    const year = project.workAssignDate.getUTCFullYear();
    const month = project.workAssignDate.getUTCMonth() + 1;
    const key = `${year}-${String(month).padStart(2, "0")}`;
    const current =
      buckets.get(key) ??
      {
        year,
        month,
        projects: 0,
        pending: 0,
        invoices: 0,
        revenue: emptyCurrencyTotals(),
        workerPay: emptyCurrencyTotals(),
        ownerCut: emptyCurrencyTotals(),
        withdrawn: emptyCurrencyTotals()
      };

    current.projects += 1;
    current.pending += project.paymentStatus === PaymentStatus.PENDING ? 1 : 0;
    current.invoices += project.invoice ? 1 : 0;
    current.revenue[project.paymentCurrency] += toNumber(project.paymentAmount);
    current.workerPay[project.paymentCurrency] += toNumber(project.workerPayAmount);
    current.ownerCut[project.paymentCurrency] += toNumber(project.ownerCutAmount);
    current.withdrawn[project.paymentCurrency] += toNumber(project.withdrawnAmount);
    buckets.set(key, current);
  }

  return Array.from(buckets.entries()).map(([key, value]) => ({
    key,
    ...value,
    remaining: {
      USD: value.revenue.USD - value.withdrawn.USD,
      EUR: value.revenue.EUR - value.withdrawn.EUR
    }
  }));
}
