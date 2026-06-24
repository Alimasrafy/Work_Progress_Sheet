import Link from "next/link";

import { StatusBadge } from "@/components/projects/status-badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatDate, formatMoney, toExternalUrl } from "@/lib/utils/format";

type TableProject = {
  id: string;
  assignedUser?: { name: string };
  workAssignDate: Date | string;
  deliveredDate?: Date | string | null;
  originalWebsiteLink: string;
  flazioWebsiteLink: string;
  paymentAmount: string | number;
  paymentCurrency: "USD" | "EUR";
  workerPayAmount?: string | number;
  ownerCutAmount?: string | number;
  withdrawnAmount: string | number;
  remainingAmount?: string | number;
  workStatus: string;
  paymentStatus: string;
  withdrawStatus: string;
  payPlatform: string;
  payoneerPaymentRequestId?: string | null;
  invoice?: string | null;
};

function asNumber(value: string | number | undefined) {
  return typeof value === "number" ? value : Number(value ?? 0);
}

export function ProjectsTable({
  title,
  projects,
  showWorker = true
}: {
  title: string;
  projects: TableProject[];
  showWorker?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-semibold">{title}</h2>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/70 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              {showWorker ? <th className="px-4 py-3 font-medium">Worker</th> : null}
              <th className="px-4 py-3 font-medium">Assigned</th>
              <th className="px-4 py-3 font-medium">Original Site</th>
              <th className="px-4 py-3 font-medium">Flazio Site</th>
              <th className="px-4 py-3 font-medium">Delivered</th>
              <th className="px-4 py-3 font-medium">Payment</th>
              <th className="px-4 py-3 font-medium">Worker Pay</th>
              <th className="px-4 py-3 font-medium">Owner Cut</th>
              <th className="px-4 py-3 font-medium">Remaining</th>
              <th className="px-4 py-3 font-medium">Statuses</th>
              <th className="px-4 py-3 font-medium">Payoneer</th>
              <th className="px-4 py-3 font-medium">Invoice</th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-8 text-center text-muted-foreground"
                  colSpan={showWorker ? 12 : 11}
                >
                  No projects found for this view.
                </td>
              </tr>
            ) : (
              projects.map((project) => {
                const payment = asNumber(project.paymentAmount);
                const remaining =
                  project.remainingAmount !== undefined
                    ? asNumber(project.remainingAmount)
                    : payment - asNumber(project.withdrawnAmount);

                return (
                  <tr key={project.id} className="border-t align-top hover:bg-muted/35">
                    {showWorker ? (
                      <td className="px-4 py-3 text-muted-foreground">
                        {project.assignedUser?.name ?? "—"}
                      </td>
                    ) : null}
                    <td className="px-4 py-3">{formatDate(project.workAssignDate)}</td>
                    <td className="max-w-[240px] px-4 py-3">
                      <Link
                        className="line-clamp-2 text-primary underline-offset-4 hover:underline"
                        href={toExternalUrl(project.originalWebsiteLink)}
                        target="_blank"
                      >
                        {project.originalWebsiteLink}
                      </Link>
                    </td>
                    <td className="max-w-[240px] px-4 py-3">
                      <Link
                        className="line-clamp-2 text-primary underline-offset-4 hover:underline"
                        href={toExternalUrl(project.flazioWebsiteLink)}
                        target="_blank"
                      >
                        {project.flazioWebsiteLink}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{formatDate(project.deliveredDate)}</td>
                    <td className="px-4 py-3">
                      {formatMoney(payment, project.paymentCurrency)}
                    </td>
                    <td className="px-4 py-3">
                      {formatMoney(
                        project.workerPayAmount === undefined
                          ? payment
                          : asNumber(project.workerPayAmount),
                        project.paymentCurrency
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {formatMoney(asNumber(project.ownerCutAmount), project.paymentCurrency)}
                    </td>
                    <td className="px-4 py-3">
                      {formatMoney(remaining, project.paymentCurrency)}
                    </td>
                    <td className="space-y-2 px-4 py-3">
                      <StatusBadge kind="work" value={project.workStatus} />
                      <StatusBadge kind="payment" value={project.paymentStatus} />
                      <StatusBadge kind="withdraw" value={project.withdrawStatus} />
                      <StatusBadge kind="platform" value={project.payPlatform} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {project.payoneerPaymentRequestId ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge kind="invoice" value={project.invoice} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
