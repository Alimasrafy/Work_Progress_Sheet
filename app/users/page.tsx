import { UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/prisma";
import { formatMoney } from "@/lib/utils/format";
import { toNumber } from "@/lib/utils/api";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return null;
  }

  if (session.user.role !== UserRole.ADMIN) {
    redirect("/dashboard");
  }

  const users = await prisma.user.findMany({
    include: {
      projects: {
        where: {
          archivedAt: null
        }
      }
    },
    orderBy: { name: "asc" }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Users</h1>
        <p className="text-sm text-muted-foreground">
          Internal access, workload totals, and role assignment.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {users.map((user) => {
          const revenue = user.projects.reduce(
            (acc, project) => {
              acc[project.paymentCurrency] += toNumber(project.paymentAmount);
              return acc;
            },
            { USD: 0, EUR: 0 }
          );
          const workerPay = user.projects.reduce(
            (acc, project) => {
              acc[project.paymentCurrency] += toNumber(project.workerPayAmount);
              return acc;
            },
            { USD: 0, EUR: 0 }
          );
          const ownerCut = user.projects.reduce(
            (acc, project) => {
              acc[project.paymentCurrency] += toNumber(project.ownerCutAmount);
              return acc;
            },
            { USD: 0, EUR: 0 }
          );

          return (
            <Card key={user.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold">{user.name}</h2>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">{user.role}</p>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Projects</p>
                  <p className="mt-1 text-2xl font-semibold">{user.projects.length}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Pending Payments</p>
                  <p className="mt-1 text-2xl font-semibold">
                    {user.projects.filter((project) => project.paymentStatus === "PENDING").length}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">EUR Revenue</p>
                  <p className="mt-1 text-lg font-semibold">{formatMoney(revenue.EUR, "EUR")}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">USD Revenue</p>
                  <p className="mt-1 text-lg font-semibold">{formatMoney(revenue.USD, "USD")}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">EUR Worker Payout</p>
                  <p className="mt-1 text-lg font-semibold">{formatMoney(workerPay.EUR, "EUR")}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">EUR Owner Cut</p>
                  <p className="mt-1 text-lg font-semibold">{formatMoney(ownerCut.EUR, "EUR")}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
