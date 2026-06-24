import type {
  PaymentCurrency,
  PaymentStatus,
  PayPlatform,
  WithdrawStatus,
  WorkStatus
} from "@prisma/client";

export type ProjectListItem = {
  id: string;
  assignedUser: {
    id: string;
    name: string;
  };
  workAssignDate: string;
  quantity: number | null;
  originalWebsiteLink: string;
  flazioWebsiteLink: string;
  deliveredDate: string | null;
  paymentAmount: string;
  paymentCurrency: PaymentCurrency;
  withdrawnAmount: string;
  remainingAmount: string;
  withdrawStatus: WithdrawStatus;
  workStatus: WorkStatus;
  paymentStatus: PaymentStatus;
  payPlatform: PayPlatform;
  payoneerPaymentRequestId: string | null;
  invoice: string | null;
};
