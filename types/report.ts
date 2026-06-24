export type CurrencyTotals = {
  USD: number;
  EUR: number;
};

export type DashboardSummary = {
  totalProjects: number;
  totalDelivered: number;
  totalPending: number;
  totalInvoices: number;
  revenue: CurrencyTotals;
  workerPay: CurrencyTotals;
  ownerCut: CurrencyTotals;
  withdrawn: CurrencyTotals;
  remaining: CurrencyTotals;
};
