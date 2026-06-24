import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import { QuickEditForm } from "@/components/projects/quick-edit-form";
import { StatusBadge } from "@/components/projects/status-badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/prisma";
import { canAccessProject } from "@/lib/permissions/projects";
import { formatDate, formatMoney, toExternalUrl } from "@/lib/utils/format";
import { toNumber } from "@/lib/utils/api";

type Params = Promise<{ id: string }>;

export default async function ProjectDetailPage({ params }: { params: Params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return null;
  }

  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      assignedUser: {
        select: {
          name: true,
          role: true
        }
      },
      activityLogs: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          actor: {
            select: {
              name: true
            }
          }
        }
      }
    }
  });

  if (!project || !canAccessProject(session, project)) {
    notFound();
  }

  const paymentAmount = toNumber(project.paymentAmount);
  const withdrawnAmount = toNumber(project.withdrawnAmount);
  const workerPayAmount = toNumber(project.workerPayAmount);
  const ownerCutAmount = toNumber(project.ownerCutAmount);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Project Details</h1>
        <p className="text-sm text-muted-foreground">
          Review assignment, delivery, payments, and audit history.
        </p>
      </div>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold">Project Snapshot</h2>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Assigned User</p>
              <p className="mt-1 text-sm font-medium">{project.assignedUser.name}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Assigned Date</p>
              <p className="mt-1 text-sm font-medium">{formatDate(project.workAssignDate)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Delivery Date</p>
              <p className="mt-1 text-sm font-medium">{formatDate(project.deliveredDate)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Quantity</p>
              <p className="mt-1 text-sm font-medium">{project.quantity ?? "—"}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Original Website</p>
              <a className="mt-1 block text-sm text-primary underline-offset-4 hover:underline" href={toExternalUrl(project.originalWebsiteLink)} target="_blank">
                {project.originalWebsiteLink}
              </a>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Flazio Website</p>
              <a className="mt-1 block text-sm text-primary underline-offset-4 hover:underline" href={toExternalUrl(project.flazioWebsiteLink)} target="_blank">
                {project.flazioWebsiteLink}
              </a>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Payment</p>
              <p className="mt-1 text-sm font-medium">
                {formatMoney(paymentAmount, project.paymentCurrency)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Remaining</p>
              <p className="mt-1 text-sm font-medium">
                {formatMoney(paymentAmount - withdrawnAmount, project.paymentCurrency)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Worker Payout</p>
              <p className="mt-1 text-sm font-medium">
                {formatMoney(workerPayAmount, project.paymentCurrency)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Owner Cut</p>
              <p className="mt-1 text-sm font-medium">
                {formatMoney(ownerCutAmount, project.paymentCurrency)}
              </p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <div className="flex flex-wrap gap-2">
                <StatusBadge kind="work" value={project.workStatus} />
                <StatusBadge kind="payment" value={project.paymentStatus} />
                <StatusBadge kind="withdraw" value={project.withdrawStatus} />
                <StatusBadge kind="platform" value={project.payPlatform} />
                <StatusBadge kind="invoice" value={project.invoice} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold">Quick Edit</h2>
          </CardHeader>
          <CardContent>
            <QuickEditForm
              id={project.id}
              invoice={project.invoice}
              paymentStatus={project.paymentStatus}
              payPlatform={project.payPlatform}
              payoneerPaymentRequestId={project.payoneerPaymentRequestId}
              withdrawnAmount={withdrawnAmount.toFixed(2)}
              withdrawStatus={project.withdrawStatus}
            />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold">Activity Log</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          {project.activityLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            project.activityLogs.map((log) => (
              <div key={log.id} className="rounded-md border p-3">
                <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm font-medium">
                    {log.fieldName ?? "project"} · {log.action}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(log.createdAt)} · {log.actor?.name ?? "System"}
                  </p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {String(log.oldValue ?? "—")} → {String(log.newValue ?? "—")}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
