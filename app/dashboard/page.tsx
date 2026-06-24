import { Banknote, FileText, Hourglass, PackageCheck, UserRound, WalletCards } from "lucide-react";
import { getServerSession } from "next-auth";

import { MonthlyRevenueChart } from "@/components/charts/monthly-revenue-chart";
import { MetricCard } from "@/components/dashboard/metric-card";
import { MonthList } from "@/components/dashboard/month-list";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { authOptions } from "@/lib/auth/options";
import { getDashboardSummary, getMonthBuckets } from "@/lib/reports/projects";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return null;
  }

  const [summary, months] = await Promise.all([
    getDashboardSummary(session, session.user.id),
    getMonthBuckets(session, session.user.id)
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">
            {session.user.name} Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Your own projects, revenue, payments, invoices, and pending work.
          </p>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={PackageCheck} label="My Projects" value={summary.totalProjects} />
        <MetricCard icon={PackageCheck} label="Delivered" value={summary.totalDelivered} />
        <MetricCard icon={Hourglass} label="Pending Payments" value={summary.totalPending} />
        <MetricCard icon={FileText} label="Invoices" value={summary.totalInvoices} />
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          icon={Banknote}
          label="My Revenue"
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
