import { PaymentCurrency } from "@prisma/client";

type PayoutInput = {
  workerName: string;
  workAssignDate: Date;
  paymentAmount: number;
  paymentCurrency: PaymentCurrency | "USD" | "EUR";
};

const sonetPayoutStart = Date.UTC(2026, 0, 1);

export function calculateProjectPayout(input: PayoutInput) {
  const isSonet = input.workerName.trim().toLowerCase() === "sayed sonet";
  const isSonetPayoutPeriod =
    input.workAssignDate.getTime() >= sonetPayoutStart &&
    input.paymentCurrency === PaymentCurrency.EUR;

  if (isSonet && isSonetPayoutPeriod) {
    const workerPayAmount = Math.min(40, input.paymentAmount);
    return {
      workerPayAmount,
      ownerCutAmount: Math.max(input.paymentAmount - workerPayAmount, 0)
    };
  }

  return {
    workerPayAmount: input.paymentAmount,
    ownerCutAmount: 0
  };
}
