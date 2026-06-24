import { getServerSession } from "next-auth";

import { ProjectsTable } from "@/components/tables/projects-table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/prisma";
import { scopeProjectWhere } from "@/lib/permissions/projects";
import { toNumber } from "@/lib/utils/api";

export default async function PayoneerPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return null;
  }

  const projects = await prisma.project.findMany({
    where: {
      ...scopeProjectWhere(session),
      payPlatform: "PAYONEER"
    },
    include: {
      assignedUser: {
        select: {
          name: true
        }
      }
    },
    orderBy: [{ payoneerPaymentRequestId: "desc" }, { workAssignDate: "desc" }]
  });

  const grouped = new Map<string, number>();
  for (const project of projects) {
    if (project.payoneerPaymentRequestId) {
      grouped.set(
        project.payoneerPaymentRequestId,
        (grouped.get(project.payoneerPaymentRequestId) ?? 0) + 1
      );
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Payoneer</h1>
        <p className="text-sm text-muted-foreground">
          Request IDs remain visible, searchable, and grouped across multiple projects.
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold">Request ID Coverage</h2>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Payoneer Projects</p>
            <p className="mt-1 text-2xl font-semibold">{projects.length}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Projects With Request ID</p>
            <p className="mt-1 text-2xl font-semibold">
              {projects.filter((project) => project.payoneerPaymentRequestId).length}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Unique Request IDs</p>
            <p className="mt-1 text-2xl font-semibold">{grouped.size}</p>
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
        title="Payoneer Project Records"
      />
    </div>
  );
}
