import { PaymentStatus, PayPlatform, WithdrawStatus, WorkStatus } from "@prisma/client";
import { z } from "zod";

export const projectQuerySchema = z.object({
  search: z.string().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2025).max(9999).optional(),
  userId: z.string().optional(),
  workStatus: z.nativeEnum(WorkStatus).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  payPlatform: z.nativeEnum(PayPlatform).optional(),
  sortBy: z
    .enum([
      "workAssignDate",
      "deliveredDate",
      "paymentAmount",
      "withdrawnAmount",
      "paymentStatus",
      "workStatus",
      "payPlatform",
      "invoice",
      "payoneerPaymentRequestId"
    ])
    .default("workAssignDate"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(25)
});

export const projectCreateSchema = z.object({
  assignedUserId: z.string().min(1),
  workAssignDate: z.coerce.date(),
  quantity: z.coerce.number().int().min(1).nullable().optional(),
  originalWebsiteLink: z.string().min(1),
  flazioWebsiteLink: z.string().min(1),
  deliveredDate: z.coerce.date().nullable().optional(),
  paymentAmount: z.coerce.number().min(0),
  paymentCurrency: z.enum(["USD", "EUR"]),
  paymentRaw: z.string().optional(),
  paymentWithdrawRaw: z.string().nullable().optional(),
  withdrawStatus: z.nativeEnum(WithdrawStatus).default(WithdrawStatus.NOT_WITHDRAWN),
  withdrawnAmount: z.coerce.number().min(0).default(0),
  workStatus: z.nativeEnum(WorkStatus).default(WorkStatus.DELIVERED),
  paymentStatus: z.nativeEnum(PaymentStatus).default(PaymentStatus.PENDING),
  payPlatform: z.nativeEnum(PayPlatform),
  payoneerPaymentRequestId: z.string().trim().nullable().optional(),
  invoice: z.string().trim().nullable().optional()
});

export const projectPatchSchema = z
  .object({
    withdrawStatus: z.nativeEnum(WithdrawStatus).optional(),
    withdrawnAmount: z.coerce.number().min(0).optional(),
    workStatus: z.nativeEnum(WorkStatus).optional(),
    paymentStatus: z.nativeEnum(PaymentStatus).optional(),
    payPlatform: z.nativeEnum(PayPlatform).optional(),
    payoneerPaymentRequestId: z.string().trim().nullable().optional(),
    invoice: z.string().trim().nullable().optional()
  })
  .strict();

export const monthQuerySchema = z.object({
  year: z.coerce.number().int().min(2025).max(9999),
  month: z.coerce.number().int().min(1).max(12),
  userId: z.string().optional()
});
