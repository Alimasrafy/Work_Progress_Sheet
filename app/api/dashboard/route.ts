import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import { getDashboardSummary } from "@/lib/reports/projects";
import { apiError } from "@/lib/utils/api";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const summary = await getDashboardSummary(
      session,
      searchParams.get("userId") ?? undefined
    );

    return NextResponse.json(summary);
  } catch (error) {
    return apiError(error);
  }
}
