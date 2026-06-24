import { getServerSession } from "next-auth";

import { ProjectsTable } from "@/components/tables/projects-table";
import { Card, CardContent } from "@/components/ui/card";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/prisma";
import { scopeProjectWhere } from "@/lib/permissions/projects";
import { toNumber } from "@/lib/utils/api";

export default async function PaymentsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return null;
  }

  const projects = await prisma.project.findMany({
    where: scopeProjectWhere(session),
    include: {
      assignedUser: {
        select: {
          name: true
        }
      }
    },
    orderBy: [{ paymentStatus: "asc" }, { workAssignDate: "desc" }]
  });

  const pending = projects.filter((project) => project.paymentStatus === "PENDING").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Payments</h1>
        <p className="text-sm text-muted-foreground">
          Revenue, withdrawn amounts, and remaining balances.
        </p>
      </div>

      <Card>
        <CardContent className="grid gap-4 py-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Pending Payments</p>
            <p className="mt-1 text-2xl font-semibold">{pending}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Records</p>
            <p className="mt-1 text-2xl font-semibold">{projects.length}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Exports</p>
            <a className="mt-2 inline-flex text-sm text-primary underline-offset-4 hover:underline" href="/api/exports/projects.csv">
              Download CSV
            </a>
          </div>
        </CardContent>
      </Card>

      <ProjectsTable
        projects={projects.map((project) => ({
          ...project,
          paymentAmount: toNumber(project.paymentAmount),
          workerPayAmount: toNumber(project.workerPayAmount),
          ownerCutAmount: toNumber(project.ownerCutAmount),
          withdrawnAmount: toNumber(project.withdrawnAmount),
          remainingAmount: toNumber(project.paymentAmount) - toNumber(project.withdrawnAmount)
        }))}
        showWorker={session.user.role === "ADMIN"}
        title="Payment Tracking"
      />
    </div>
  );
}
