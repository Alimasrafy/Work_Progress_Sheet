import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import { getMonthBuckets } from "@/lib/reports/projects";
import { apiError } from "@/lib/utils/api";

export async function GET() {
  try {
    const session = await requireSession();
    const months = await getMonthBuckets(session);
    const yearly = new Map<string, (typeof months)[number] & { months: number }>();

    for (const month of months) {
      const key = String(month.year);
      const current =
        yearly.get(key) ??
        ({
          ...month,
          key,
          month: 0,
          projects: 0,
          pending: 0,
          invoices: 0,
          revenue: { USD: 0, EUR: 0 },
          withdrawn: { USD: 0, EUR: 0 },
          remaining: { USD: 0, EUR: 0 },
          months: 0
        } as (typeof months)[number] & { months: number });

      current.projects += month.projects;
      current.pending += month.pending;
      current.invoices += month.invoices;
      current.revenue.USD += month.revenue.USD;
      current.revenue.EUR += month.revenue.EUR;
      current.withdrawn.USD += month.withdrawn.USD;
      current.withdrawn.EUR += month.withdrawn.EUR;
      current.remaining.USD += month.remaining.USD;
      current.remaining.EUR += month.remaining.EUR;
      current.months += 1;
      yearly.set(key, current);
    }

    return NextResponse.json(Array.from(yearly.values()));
  } catch (error) {
    return apiError(error);
  }
}
