import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { scopeProjectWhere } from "@/lib/permissions/projects";
import { apiError, toNumber } from "@/lib/utils/api";

export async function GET() {
  try {
    const session = await requireSession();
    const projects = await prisma.project.findMany({
      where: scopeProjectWhere(session),
      include: {
        assignedUser: {
          select: { name: true }
        }
      },
      orderBy: { workAssignDate: "desc" }
    });

    const rows = projects.map((project) => {
      const paymentAmount = toNumber(project.paymentAmount);
      const workerPayAmount = toNumber(project.workerPayAmount);
      const ownerCutAmount = toNumber(project.ownerCutAmount);
      const withdrawnAmount = toNumber(project.withdrawnAmount);
      return {
        Worker: project.assignedUser.name,
        "Work Assign Date": project.workAssignDate.toISOString().slice(0, 10),
        Quantity: project.quantity,
        "Original Website Link": project.originalWebsiteLink,
        "Flazio Website Link": project.flazioWebsiteLink,
        "Delivered Date": project.deliveredDate?.toISOString().slice(0, 10) ?? "",
        "Payment Amount": paymentAmount,
        Currency: project.paymentCurrency,
        "Worker Pay Amount": workerPayAmount,
        "Owner Cut Amount": ownerCutAmount,
        "Withdrawn Amount": withdrawnAmount,
        "Remaining Amount": paymentAmount - withdrawnAmount,
        "Work Status": project.workStatus,
        "Payment Status": project.paymentStatus,
        "Pay Platform": project.payPlatform,
        "Payoneer Payment Request ID": project.payoneerPaymentRequestId ?? "",
        Invoice: project.invoice ?? ""
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Projects");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="projects.xlsx"'
      }
    });
  } catch (error) {
    return apiError(error);
  }
}
