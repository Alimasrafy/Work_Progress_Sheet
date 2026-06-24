import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import { getMonthlySummary } from "@/lib/reports/projects";
import { monthQuerySchema } from "@/lib/validators/project";
import { apiError } from "@/lib/utils/api";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const query = monthQuerySchema.parse(Object.fromEntries(searchParams));
    const data = await getMonthlySummary(session, query);

    return NextResponse.json(data);
  } catch (error) {
    return apiError(error);
  }
}
