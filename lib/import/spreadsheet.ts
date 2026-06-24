import {
  ActivityAction,
  PaymentCurrency,
  PaymentStatus,
  PayPlatform,
  Prisma,
  UserRole,
  WorkStatus,
  WithdrawStatus
} from "@prisma/client";
import * as XLSX from "xlsx";

import { prisma } from "@/lib/db/prisma";
import { calculateProjectPayout } from "@/lib/payments/payout";

const monthNames = new Set([
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december"
]);

function excelDateToDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
    }
  }

  if (typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  return null;
}

function cleanText(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function parsePayment(value: unknown) {
  const raw = cleanText(value) ?? "0";
  const amountMatch = raw.match(/[-+]?\d+(?:[.,]\d+)?/);
  const paymentAmount = amountMatch
    ? Number(amountMatch[0].replace(",", "."))
    : 0;
  const lower = raw.toLowerCase();
  const paymentCurrency = lower.includes("usd")
    ? PaymentCurrency.USD
    : PaymentCurrency.EUR;

  return { paymentRaw: raw, paymentAmount, paymentCurrency };
}

function normalizePaymentStatus(value: unknown) {
  return cleanText(value)?.toLowerCase() === "done"
    ? PaymentStatus.DONE
    : PaymentStatus.PENDING;
}

function normalizeWorkStatus(value: unknown) {
  const text = cleanText(value)?.toLowerCase();
  if (text === "delivered") {
    return WorkStatus.DELIVERED;
  }
  if (text === "cancelled") {
    return WorkStatus.CANCELLED;
  }
  if (text === "pending") {
    return WorkStatus.PENDING;
  }
  return WorkStatus.IN_PROGRESS;
}

function normalizePayPlatform(value: unknown) {
  const text = cleanText(value)?.toLowerCase();
  if (text === "fiverr") {
    return PayPlatform.FIVERR;
  }
  if (text === "payoneer") {
    return PayPlatform.PAYONEER;
  }
  return PayPlatform.OTHER;
}

function normalizeWithdraw(value: unknown, paymentAmount: number) {
  const raw = cleanText(value);
  const isWithdrawn = raw?.toLowerCase() === "withdrawn";

  return {
    paymentWithdrawRaw: raw,
    withdrawStatus: isWithdrawn
      ? WithdrawStatus.WITHDRAWN
      : WithdrawStatus.NOT_WITHDRAWN,
    withdrawnAmount: isWithdrawn ? paymentAmount : 0
  };
}

function shouldSkipRow(firstCell: unknown) {
  const text = cleanText(firstCell)?.toLowerCase();
  return (
    !firstCell ||
    text === "weekend" ||
    Boolean(text && monthNames.has(text)) ||
    firstCell === 2025 ||
    firstCell === 2026 ||
    text === "work assign date"
  );
}

export async function importSpreadsheet(input: {
  fileBuffer: Buffer;
  actorUserId: string;
}) {
  const workbook = XLSX.read(input.fileBuffer, {
    type: "buffer",
    cellDates: true
  });

  let imported = 0;
  let skipped = 0;
  const warnings: string[] = [];

  await prisma.$transaction(async (tx) => {
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
        header: 1,
        blankrows: false,
        raw: true
      });

      const fallbackEmail = `${sheetName.toLowerCase().replace(/\s+/g, ".")}@internal.local`;
      const existingUser = await tx.user.findFirst({
        where: {
          OR: [{ name: sheetName }, { email: fallbackEmail }]
        }
      });

      const user =
        existingUser ??
        (await tx.user.create({
          data: {
            name: sheetName,
            email: fallbackEmail,
            role: sheetName === "Ali Masrafi" ? UserRole.ADMIN : UserRole.TEAM_MEMBER
          }
        }));

      for (const [index, row] of rows.entries()) {
        const sourceRowNumber = index + 1;
        const workAssignDate = excelDateToDate(row[0]);

        if (shouldSkipRow(row[0]) || !workAssignDate) {
          skipped += 1;
          continue;
        }

        const deliveredDate = excelDateToDate(row[4]);
        const { paymentAmount, paymentCurrency, paymentRaw } = parsePayment(row[5]);
        const withdraw = normalizeWithdraw(row[6], paymentAmount);
        const payout = calculateProjectPayout({
          workerName: sheetName,
          workAssignDate,
          paymentAmount,
          paymentCurrency
        });

        const sourceKey = {
          sourceSheetName_sourceRowNumber: {
            sourceSheetName: sheetName,
            sourceRowNumber
          }
        };

        const existing = await tx.project.findUnique({ where: sourceKey });
        if (existing) {
          skipped += 1;
          continue;
        }

        const project = await tx.project.create({
          data: {
            assignedUserId: user.id,
            workAssignDate,
            quantity: row[1] ? Number(row[1]) : null,
            originalWebsiteLink: cleanText(row[2]) ?? "",
            flazioWebsiteLink: cleanText(row[3]) ?? "",
            deliveredDate,
            paymentAmount: new Prisma.Decimal(paymentAmount),
            paymentCurrency,
            paymentRaw,
            workerPayAmount: new Prisma.Decimal(payout.workerPayAmount),
            ownerCutAmount: new Prisma.Decimal(payout.ownerCutAmount),
            paymentWithdrawRaw: withdraw.paymentWithdrawRaw,
            withdrawStatus: withdraw.withdrawStatus,
            withdrawnAmount: new Prisma.Decimal(withdraw.withdrawnAmount),
            workStatus: normalizeWorkStatus(row[7]),
            paymentStatus: normalizePaymentStatus(row[8]),
            payPlatform: normalizePayPlatform(row[9]),
            payoneerPaymentRequestId: cleanText(row[10]),
            invoice: cleanText(row[11]),
            sourceSheetName: sheetName,
            sourceRowNumber
          }
        });

        await tx.activityLog.create({
          data: {
            projectId: project.id,
            actorUserId: input.actorUserId,
            action: ActivityAction.IMPORT,
            fieldName: "project",
            newValue: `${sheetName}:${sourceRowNumber}`
          }
        });

        if (deliveredDate && deliveredDate < workAssignDate) {
          warnings.push(
            `${sheetName} row ${sourceRowNumber}: delivered date is before assigned date`
          );
        }

        imported += 1;
      }
    }
  });

  return { imported, skipped, warnings };
}
