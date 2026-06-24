import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { apiError } from "@/lib/utils/api";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const take = Math.min(Number(searchParams.get("limit") ?? 100), 500);

    const logs = await prisma.activityLog.findMany({
      take,
      orderBy: { createdAt: "desc" },
      include: {
        actor: {
          select: {
            name: true,
            email: true
          }
        },
        project: {
          select: {
            id: true,
            originalWebsiteLink: true,
            flazioWebsiteLink: true
          }
        }
      }
    });

    return NextResponse.json(logs);
  } catch (error) {
    return apiError(error);
  }
}
