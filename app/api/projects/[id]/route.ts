import { ActivityAction, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { writeActivityLog } from "@/lib/activity-log/log";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import {
  assertProjectEditableFields,
  canAccessProject
} from "@/lib/permissions/projects";
import { projectPatchSchema } from "@/lib/validators/project";
import { apiError, toNumber } from "@/lib/utils/api";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await context.params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true
          }
        },
        activityLogs: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            actor: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    if (!project || !canAccessProject(session, project)) {
      throw new Response("Not found", { status: 404 });
    }

    const paymentAmount = toNumber(project.paymentAmount);
    const workerPayAmount = toNumber(project.workerPayAmount);
    const ownerCutAmount = toNumber(project.ownerCutAmount);
    const withdrawnAmount = toNumber(project.withdrawnAmount);

    return NextResponse.json({
      ...project,
      paymentAmount: paymentAmount.toFixed(2),
      workerPayAmount: workerPayAmount.toFixed(2),
      ownerCutAmount: ownerCutAmount.toFixed(2),
      withdrawnAmount: withdrawnAmount.toFixed(2),
      remainingAmount: (paymentAmount - withdrawnAmount).toFixed(2)
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await context.params;
    const body = projectPatchSchema.parse(await request.json());
    const fields = Object.keys(body);
    assertProjectEditableFields(fields);

    const project = await prisma.project.findUnique({ where: { id } });

    if (!project || !canAccessProject(session, project)) {
      throw new Response("Not found", { status: 404 });
    }

    if (
      body.withdrawnAmount !== undefined &&
      body.withdrawnAmount > toNumber(project.paymentAmount)
    ) {
      throw new Response("Withdrawn amount cannot exceed payment amount", {
        status: 400
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.project.update({
        where: { id },
        data: {
          ...body,
          withdrawnAmount:
            body.withdrawnAmount === undefined
              ? undefined
              : new Prisma.Decimal(body.withdrawnAmount)
        }
      });

      await Promise.all(
        fields.map((field) =>
          writeActivityLog({
            tx,
            projectId: id,
            actorUserId: session.user.id,
            action: ActivityAction.UPDATE,
            fieldName: field,
            oldValue: project[field as keyof typeof project],
            newValue: body[field as keyof typeof body]
          })
        )
      );

      return result;
    });

    const paymentAmount = toNumber(updated.paymentAmount);
    const workerPayAmount = toNumber(updated.workerPayAmount);
    const ownerCutAmount = toNumber(updated.ownerCutAmount);
    const withdrawnAmount = toNumber(updated.withdrawnAmount);

    return NextResponse.json({
      ...updated,
      paymentAmount: paymentAmount.toFixed(2),
      workerPayAmount: workerPayAmount.toFixed(2),
      ownerCutAmount: ownerCutAmount.toFixed(2),
      withdrawnAmount: withdrawnAmount.toFixed(2),
      remainingAmount: (paymentAmount - withdrawnAmount).toFixed(2)
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await context.params;

    if (session.user.role !== "ADMIN") {
      throw new Response("Forbidden", { status: 403 });
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        archivedAt: new Date()
      }
    });

    await writeActivityLog({
      projectId: id,
      actorUserId: session.user.id,
      action: ActivityAction.ARCHIVE,
      fieldName: "archivedAt",
      oldValue: null,
      newValue: project.archivedAt
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
