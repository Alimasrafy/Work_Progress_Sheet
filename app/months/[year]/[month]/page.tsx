import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";

import { MetricCard } from "@/components/dashboard/metric-card";
import { ProjectsTable } from "@/components/tables/projects-table";
import { Card, CardContent } from "@/components/ui/card";
import { authOptions } from "@/lib/auth/options";
import { getMonthlySummary } from "@/lib/reports/projects";
import { formatMonthKey } from "@/lib/utils/format";
import { Banknote, FileText, Hourglass, PackageCheck } from "lucide-react";
import { toNumber } from "@/lib/utils/api";

type Params = Promise<{ year: string; month: string }>;

export default async function MonthlyPage({ params }: { params: Params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return null;
  }

  const resolved = await params;
  const year = Number(resolved.year);
  const month = Number(resolved.month);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    notFound();
  }

  const data = await getMonthlySummary(session, { year, month });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">{formatMonthKey(`${resolved.year}-${resolved.month}`)}</h1>
        <p className="text-sm text-muted-foreground">
          Dynamic month view generated from assignment dates.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={PackageCheck} label="Projects" value={data.month.totalProjects} />
        <MetricCard icon={Hourglass} label="Pending Payments" value={data.month.totalPending} />
        <MetricCard icon={FileText} label="Invoices" value={data.month.totalInvoices} />
        <MetricCard
          helper={`USD ${data.month.revenue.USD.toFixed(0)}`}
          icon={Banknote}
          label="EUR Revenue"
          value={data.month.revenue.EUR.toFixed(0)}
        />
      </section>

      <Card>
        <CardContent className="grid gap-4 py-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Revenue</p>
            <p className="mt-1 text-lg font-semibold">
              EUR {data.month.revenue.EUR.toFixed(2)} / USD {data.month.revenue.USD.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Withdrawn</p>
            <p className="mt-1 text-lg font-semibold">
              EUR {data.month.withdrawn.EUR.toFixed(2)} / USD {data.month.withdrawn.USD.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Worker Payout</p>
            <p className="mt-1 text-lg font-semibold">
              EUR {data.month.workerPay.EUR.toFixed(2)} / USD {data.month.workerPay.USD.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Owner Cut</p>
            <p className="mt-1 text-lg font-semibold">
              EUR {data.month.ownerCut.EUR.toFixed(2)} / USD {data.month.ownerCut.USD.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Remaining</p>
            <p className="mt-1 text-lg font-semibold">
              EUR {data.month.remaining.EUR.toFixed(2)} / USD {data.month.remaining.USD.toFixed(2)}
            </p>
          </div>
        </CardContent>
      </Card>

      <ProjectsTable
        projects={data.projects.map((project) => ({
          ...project,
          paymentAmount: toNumber(project.paymentAmount),
          workerPayAmount: toNumber(project.workerPayAmount),
          ownerCutAmount: toNumber(project.ownerCutAmount),
          withdrawnAmount: toNumber(project.withdrawnAmount),
          remainingAmount: toNumber(project.paymentAmount) - toNumber(project.withdrawnAmount)
        }))}
        showWorker={session.user.role === "ADMIN"}
        title="Projects in This Month"
      />
    </div>
  );
}
