import { getServerSession } from "next-auth";

import { MonthList } from "@/components/dashboard/month-list";
import { ProjectsTable } from "@/components/tables/projects-table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/prisma";
import { scopeProjectWhere } from "@/lib/permissions/projects";
import { getMonthBuckets } from "@/lib/reports/projects";
import { formatMoney } from "@/lib/utils/format";
import { toNumber } from "@/lib/utils/api";

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return null;
  }

  const [months, invoiceProjects, payoneerProjects] = await Promise.all([
    getMonthBuckets(session),
    prisma.project.findMany({
      where: {
        ...scopeProjectWhere(session),
        invoice: { not: null }
      },
      include: {
        assignedUser: {
          select: {
            name: true
          }
        }
      },
      orderBy: { workAssignDate: "desc" },
      take: 12
    }),
    prisma.project.findMany({
      where: {
        ...scopeProjectWhere(session),
        payoneerPaymentRequestId: { not: null }
      },
      include: {
        assignedUser: {
          select: {
            name: true
          }
        }
      },
      orderBy: { workAssignDate: "desc" },
      take: 12
    })
  ]);

  const totalRevenue = months.reduce(
    (acc, month) => {
      acc.EUR += month.revenue.EUR;
      acc.USD += month.revenue.USD;
      return acc;
    },
    { EUR: 0, USD: 0 }
  );
  const totalWorkerPay = months.reduce(
    (acc, month) => {
      acc.EUR += month.workerPay.EUR;
      acc.USD += month.workerPay.USD;
      return acc;
    },
    { EUR: 0, USD: 0 }
  );
  const totalOwnerCut = months.reduce(
    (acc, month) => {
      acc.EUR += month.ownerCut.EUR;
      acc.USD += month.ownerCut.USD;
      return acc;
    },
    { EUR: 0, USD: 0 }
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Monthly, invoice, revenue, and Payoneer reporting.
          </p>
        </div>
        <a
          className="inline-flex h-10 items-center justify-center rounded-md border bg-secondary px-4 text-sm font-medium text-secondary-foreground transition hover:bg-muted"
          href="/api/exports/report.pdf"
        >
          Export PDF Summary
        </a>
      </div>

      <section className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <MonthList months={months} />
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold">Revenue Snapshot</h2>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Months Covered</p>
              <p className="mt-1 text-2xl font-semibold">{months.length}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">EUR Revenue</p>
              <p className="mt-1 text-2xl font-semibold">{formatMoney(totalRevenue.EUR, "EUR")}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">USD Revenue</p>
              <p className="mt-1 text-2xl font-semibold">{formatMoney(totalRevenue.USD, "USD")}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">EUR Worker Payout</p>
              <p className="mt-1 text-2xl font-semibold">{formatMoney(totalWorkerPay.EUR, "EUR")}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">EUR Owner Cut</p>
              <p className="mt-1 text-2xl font-semibold">{formatMoney(totalOwnerCut.EUR, "EUR")}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">USD Worker Payout</p>
              <p className="mt-1 text-2xl font-semibold">{formatMoney(totalWorkerPay.USD, "USD")}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <ProjectsTable
        projects={invoiceProjects.map((project) => ({
          ...project,
          paymentAmount: toNumber(project.paymentAmount),
          workerPayAmount: toNumber(project.workerPayAmount),
          ownerCutAmount: toNumber(project.ownerCutAmount),
          withdrawnAmount: toNumber(project.withdrawnAmount),
          remainingAmount: toNumber(project.paymentAmount) - toNumber(project.withdrawnAmount)
        }))}
        showWorker={session.user.role === "ADMIN"}
        title="Recent Invoice Records"
      />

      <ProjectsTable
        projects={payoneerProjects.map((project) => ({
          ...project,
          paymentAmount: toNumber(project.paymentAmount),
          workerPayAmount: toNumber(project.workerPayAmount),
          ownerCutAmount: toNumber(project.ownerCutAmount),
          withdrawnAmount: toNumber(project.withdrawnAmount),
          remainingAmount: toNumber(project.paymentAmount) - toNumber(project.withdrawnAmount)
        }))}
        showWorker={session.user.role === "ADMIN"}
        title="Recent Payoneer Records"
      />
    </div>
  );
}
