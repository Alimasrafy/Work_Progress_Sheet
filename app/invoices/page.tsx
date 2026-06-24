import { getServerSession } from "next-auth";

import { ProjectsTable } from "@/components/tables/projects-table";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/prisma";
import { scopeProjectWhere } from "@/lib/permissions/projects";
import { toNumber } from "@/lib/utils/api";

export default async function InvoicesPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return null;
  }

  const projects = await prisma.project.findMany({
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
    orderBy: { workAssignDate: "desc" }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Invoices</h1>
        <p className="text-sm text-muted-foreground">
          Searchable invoice-linked projects, ready for export and review.
        </p>
      </div>

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
        title="Invoice Records"
      />
    </div>
  );
}
