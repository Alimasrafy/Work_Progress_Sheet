import type { UserRole } from "@prisma/client";

export const editableProjectFields = [
  "withdrawStatus",
  "withdrawnAmount",
  "workStatus",
  "paymentStatus",
  "payPlatform",
  "payoneerPaymentRequestId",
  "invoice"
] as const;

export type EditableProjectField = (typeof editableProjectFields)[number];

export const roleLabels: Record<UserRole, string> = {
  ADMIN: "Admin",
  TEAM_MEMBER: "Team Member"
};
