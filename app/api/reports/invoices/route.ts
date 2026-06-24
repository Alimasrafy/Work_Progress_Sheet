import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { scopeProjectWhere } from "@/lib/permissions/projects";
import { apiError } from "@/lib/utils/api";

export async function GET() {
  try {
    const session = await requireSession();
    const projects = await prisma.project.findMany({
      where: {
        ...scopeProjectWhere(session),
        invoice: { not: null }
      },
      include: { assignedUser: { select: { name: true } } },
      orderBy: { workAssignDate: "desc" }
    });

    return NextResponse.json(projects);
  } catch (error) {
    return apiError(error);
  }
}
