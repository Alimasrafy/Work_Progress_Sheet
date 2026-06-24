import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import { getMonthBuckets } from "@/lib/reports/projects";
import { apiError } from "@/lib/utils/api";

export async function GET() {
  try {
    const session = await requireSession();
    return NextResponse.json(await getMonthBuckets(session));
  } catch (error) {
    return apiError(error);
  }
}
