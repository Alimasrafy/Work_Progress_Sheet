import { Banknote, FileText, Hourglass, PackageCheck, UserRound, WalletCards } from "lucide-react";
import { getServerSession } from "next-auth";

import { MonthlyRevenueChart } from "@/components/charts/monthly-revenue-chart";
import { MetricCard } from "@/components/dashboard/metric-card";
import { MonthList } from "@/components/dashboard/month-list";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/prisma";
import { getDashboardSummary, getMonthBuckets } from "@/lib/reports/projects";
import { formatMoney } from "@/lib/utils/format";

export default async function TotalDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return null;
  }

  const [summary, months, users] = await Promise.all([
    getDashboardSummary(session, undefined, true),
    getMonthBuckets(session, undefined, true),
    prisma.user.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, role: true }
    })
  ]);
  const workerSummaries = await Promise.all(
    users.map(async (user) => ({
      user,
      summary: await getDashboardSummary(session, user.id)
    }))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Total Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Full business totals across Ali and Sonet.
          </p>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={PackageCheck} label="Total Projects" value={summary.totalProjects} />
        <MetricCard icon={PackageCheck} label="Delivered" value={summary.totalDelivered} />
        <MetricCard icon={Hourglass} label="Pending Payments" value={summary.totalPending} />
        <MetricCard icon={FileText} label="Invoices" value={summary.totalInvoices} />
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          icon={Banknote}
          label="Total Revenue"
          value={`EUR ${summary.revenue.EUR.toFixed(0)}`}
          helper={`USD ${summary.revenue.USD.toFixed(0)}`}
        />
        <MetricCard
          icon={UserRound}
          label="Worker Payout"
          value={`EUR ${summary.workerPay.EUR.toFixed(0)}`}
          helper={`USD ${summary.workerPay.USD.toFixed(0)}`}
        />
        <MetricCard
          icon={Banknote}
          label="Owner Cut"
          value={`EUR ${summary.ownerCut.EUR.toFixed(0)}`}
          helper={`USD ${summary.ownerCut.USD.toFixed(0)}`}
        />
        <MetricCard
          icon={WalletCards}
          label="Withdrawn"
          value={`EUR ${summary.withdrawn.EUR.toFixed(0)}`}
          helper={`USD ${summary.withdrawn.USD.toFixed(0)}`}
        />
        <MetricCard
          icon={Banknote}
          label="Remaining"
          value={`EUR ${summary.remaining.EUR.toFixed(0)}`}
          helper={`USD ${summary.remaining.USD.toFixed(0)}`}
        />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold">Worker Dashboards</h2>
          <p className="text-sm text-muted-foreground">
            Ali and Sonet totals are separated here.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {workerSummaries.map(({ user, summary: workerSummary }) => (
            <Card key={user.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold">{user.name}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <span className="rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                    {user.role}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Projects</p>
                  <p className="mt-1 text-xl font-semibold">{workerSummary.totalProjects}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Revenue</p>
                  <p className="mt-1 text-sm font-semibold">
                    {formatMoney(workerSummary.revenue.EUR, "EUR")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatMoney(workerSummary.revenue.USD, "USD")}
                  </p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Worker Payout</p>
                  <p className="mt-1 text-sm font-semibold">
                    {formatMoney(workerSummary.workerPay.EUR, "EUR")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatMoney(workerSummary.workerPay.USD, "USD")}
                  </p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Owner Cut</p>
                  <p className="mt-1 text-sm font-semibold">
                    {formatMoney(workerSummary.ownerCut.EUR, "EUR")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatMoney(workerSummary.ownerCut.USD, "USD")}
                  </p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="mt-1 text-xl font-semibold">{workerSummary.totalPending}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Invoices</p>
                  <p className="mt-1 text-xl font-semibold">{workerSummary.totalInvoices}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold">Revenue by Month</h2>
          </CardHeader>
          <CardContent>
            <div className="h-[340px]">
              <MonthlyRevenueChart months={months} />
            </div>
          </CardContent>
        </Card>
        <MonthList months={months} />
      </section>
    </div>
  );
}
