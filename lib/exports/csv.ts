import type { Project, User } from "@prisma/client";

import { toNumber } from "@/lib/utils/api";

type ExportProject = Project & {
  assignedUser: Pick<User, "name">;
};

function escapeCsv(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function projectsToCsv(projects: ExportProject[]) {
  const headers = [
    "Worker",
    "Work Assign Date",
    "Quantity",
    "Original Website Link",
    "Flazio Website Link",
    "Delivered Date",
    "Payment Amount",
    "Currency",
    "Worker Pay Amount",
    "Owner Cut Amount",
    "Withdrawn Amount",
    "Remaining Amount",
    "Work Status",
    "Payment Status",
    "Pay Platform",
    "Payoneer Payment Request ID",
    "Invoice"
  ];

  const rows = projects.map((project) => {
    const paymentAmount = toNumber(project.paymentAmount);
    const workerPayAmount = toNumber(project.workerPayAmount);
    const ownerCutAmount = toNumber(project.ownerCutAmount);
    const withdrawnAmount = toNumber(project.withdrawnAmount);

    return [
      project.assignedUser.name,
      project.workAssignDate.toISOString().slice(0, 10),
      project.quantity,
      project.originalWebsiteLink,
      project.flazioWebsiteLink,
      project.deliveredDate?.toISOString().slice(0, 10),
      paymentAmount.toFixed(2),
      project.paymentCurrency,
      workerPayAmount.toFixed(2),
      ownerCutAmount.toFixed(2),
      withdrawnAmount.toFixed(2),
      (paymentAmount - withdrawnAmount).toFixed(2),
      project.workStatus,
      project.paymentStatus,
      project.payPlatform,
      project.payoneerPaymentRequestId,
      project.invoice
    ];
  });

  return [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
}
