import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import { getMonthBuckets } from "@/lib/reports/projects";
import { apiError } from "@/lib/utils/api";

export async function GET() {
  try {
    const session = await requireSession();
    const months = await getMonthBuckets(session);
    return NextResponse.json(
      months.map((month) => ({
        key: month.key,
        year: month.year,
        month: month.month,
        revenue: month.revenue,
        withdrawn: month.withdrawn,
        remaining: month.remaining
      }))
    );
  } catch (error) {
    return apiError(error);
  }
}
