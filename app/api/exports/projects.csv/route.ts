import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { projectsToCsv } from "@/lib/exports/csv";
import { scopeProjectWhere } from "@/lib/permissions/projects";
import { apiError } from "@/lib/utils/api";

export async function GET() {
  try {
    const session = await requireSession();
    const projects = await prisma.project.findMany({
      where: scopeProjectWhere(session),
      include: {
        assignedUser: {
          select: {
            name: true
          }
        }
      },
      orderBy: { workAssignDate: "desc" }
    });

    return new NextResponse(projectsToCsv(projects), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="projects.csv"'
      }
    });
  } catch (error) {
    return apiError(error);
  }
}
