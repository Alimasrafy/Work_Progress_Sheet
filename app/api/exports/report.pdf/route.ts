import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import { getDashboardSummary, getMonthBuckets } from "@/lib/reports/projects";
import { apiError } from "@/lib/utils/api";

export async function GET() {
  try {
    const session = await requireSession();
    const [summary, months] = await Promise.all([
      getDashboardSummary(session),
      getMonthBuckets(session)
    ]);

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([612, 792]);
    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    page.drawText("Work Progress Report", {
      x: 48,
      y: 730,
      size: 22,
      font: bold,
      color: rgb(0.08, 0.1, 0.14)
    });

    const lines = [
      `Total Projects: ${summary.totalProjects}`,
      `Delivered: ${summary.totalDelivered}`,
      `Pending Payments: ${summary.totalPending}`,
      `Invoices: ${summary.totalInvoices}`,
      `Revenue: USD ${summary.revenue.USD.toFixed(2)} / EUR ${summary.revenue.EUR.toFixed(2)}`,
      `Worker Payout: USD ${summary.workerPay.USD.toFixed(2)} / EUR ${summary.workerPay.EUR.toFixed(2)}`,
      `Owner Cut: USD ${summary.ownerCut.USD.toFixed(2)} / EUR ${summary.ownerCut.EUR.toFixed(2)}`,
      `Withdrawn: USD ${summary.withdrawn.USD.toFixed(2)} / EUR ${summary.withdrawn.EUR.toFixed(2)}`,
      `Remaining: USD ${summary.remaining.USD.toFixed(2)} / EUR ${summary.remaining.EUR.toFixed(2)}`
    ];

    lines.forEach((line, index) => {
      page.drawText(line, {
        x: 48,
        y: 690 - index * 24,
        size: 12,
        font: regular,
        color: rgb(0.15, 0.18, 0.25)
      });
    });

    page.drawText("Monthly Summary", {
      x: 48,
      y: 450,
      size: 14,
      font: bold,
      color: rgb(0.08, 0.1, 0.14)
    });

    months.slice(0, 14).forEach((month, index) => {
      page.drawText(
        `${month.key}: ${month.projects} projects, ${month.pending} pending, EUR ${month.revenue.EUR.toFixed(2)}, USD ${month.revenue.USD.toFixed(2)}`,
        {
          x: 48,
          y: 420 - index * 20,
          size: 10,
          font: regular,
          color: rgb(0.15, 0.18, 0.25)
        }
      );
    });

    const bytes = await pdf.save();

    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="work-progress-report.pdf"'
      }
    });
  } catch (error) {
    return apiError(error);
  }
}
