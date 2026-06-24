import { UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";

import { ProjectFilters } from "@/components/projects/project-filters";
import { ProjectsTable } from "@/components/tables/projects-table";
import { Card, CardContent } from "@/components/ui/card";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/prisma";
import { scopeProjectWhere } from "@/lib/permissions/projects";
import { projectQuerySchema } from "@/lib/validators/project";
import { toNumber } from "@/lib/utils/api";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ProjectsPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return null;
  }

  const resolvedSearchParams = await searchParams;
  const query = projectQuerySchema.parse(resolvedSearchParams);

  const workAssignDate =
    query.year && query.month
      ? {
          gte: new Date(Date.UTC(query.year, query.month - 1, 1)),
          lt: new Date(Date.UTC(query.year, query.month, 1))
        }
      : undefined;

  const where = {
    ...scopeProjectWhere(session),
    ...(query.userId && session.user.role === UserRole.ADMIN
      ? { assignedUserId: query.userId }
      : {}),
    ...(query.workStatus ? { workStatus: query.workStatus } : {}),
    ...(query.paymentStatus ? { paymentStatus: query.paymentStatus } : {}),
    ...(query.payPlatform ? { payPlatform: query.payPlatform } : {}),
    ...(workAssignDate ? { workAssignDate } : {}),
    ...(query.search
      ? {
          OR: [
            { originalWebsiteLink: { contains: query.search } },
            { flazioWebsiteLink: { contains: query.search } },
            { payoneerPaymentRequestId: { contains: query.search } },
            { invoice: { contains: query.search } }
          ]
        }
      : {})
  };

  const [users, total, projects] = await Promise.all([
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true }
    }),
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      include: {
        assignedUser: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        [query.sortBy]: query.sortOrder
      },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize
    })
  ]);

  const tableProjects = projects.map((project) => {
    const paymentAmount = toNumber(project.paymentAmount);
    const withdrawnAmount = toNumber(project.withdrawnAmount);
    const workerPayAmount = toNumber(project.workerPayAmount);
    const ownerCutAmount = toNumber(project.ownerCutAmount);

    return {
      ...project,
      paymentAmount,
      workerPayAmount,
      ownerCutAmount,
      withdrawnAmount,
      remainingAmount: paymentAmount - withdrawnAmount
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Search, filter, and inspect the normalized project list.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            className="inline-flex h-10 items-center justify-center rounded-md border border-primary bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:brightness-95"
            href="/api/exports/projects.csv"
          >
            Export CSV
          </a>
          <a
            className="inline-flex h-10 items-center justify-center rounded-md border bg-secondary px-4 text-sm font-medium text-secondary-foreground transition hover:bg-muted"
            href="/api/exports/projects.xlsx"
          >
            Export Excel
          </a>
        </div>
      </div>

      <ProjectFilters
        searchParams={resolvedSearchParams}
        showUserFilter={session.user.role === UserRole.ADMIN}
        users={users}
      />

      <Card>
        <CardContent className="flex items-center justify-between gap-4 py-4">
          <p className="text-sm text-muted-foreground">
            Showing {tableProjects.length} of {total} projects
          </p>
          <p className="text-sm text-muted-foreground">
            Page {query.page} · Page size {query.pageSize}
          </p>
        </CardContent>
      </Card>

      <ProjectsTable
        projects={tableProjects}
        showWorker={session.user.role === UserRole.ADMIN}
        title="Project Register"
      />
    </div>
  );
}
