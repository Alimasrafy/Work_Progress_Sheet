import { ActivityAction, Prisma, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";

import { requireSession } from "@/lib/auth/session";
import { writeActivityLog } from "@/lib/activity-log/log";
import { prisma } from "@/lib/db/prisma";
import { calculateProjectPayout } from "@/lib/payments/payout";
import { scopeProjectWhere } from "@/lib/permissions/projects";
import { projectCreateSchema, projectQuerySchema } from "@/lib/validators/project";
import { apiError, toNumber } from "@/lib/utils/api";
import type { Prisma as PrismaTypes } from "@prisma/client";

function dateRange(year?: number, month?: number) {
  if (!year || !month) {
    return undefined;
  }

  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { gte: start, lt: end };
}

function serializeProject(project: Awaited<ReturnType<typeof prisma.project.findFirst>>) {
  if (!project) {
    return project;
  }

  const paymentAmount = toNumber(project.paymentAmount);
  const workerPayAmount = toNumber(project.workerPayAmount);
  const ownerCutAmount = toNumber(project.ownerCutAmount);
  const withdrawnAmount = toNumber(project.withdrawnAmount);

  return {
    ...project,
    paymentAmount: paymentAmount.toFixed(2),
    workerPayAmount: workerPayAmount.toFixed(2),
    ownerCutAmount: ownerCutAmount.toFixed(2),
    withdrawnAmount: withdrawnAmount.toFixed(2),
    remainingAmount: (paymentAmount - withdrawnAmount).toFixed(2)
  };
}

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const query = projectQuerySchema.parse(Object.fromEntries(searchParams));

    const where: PrismaTypes.ProjectWhereInput = {
      ...scopeProjectWhere(session),
      ...(query.userId && session.user.role === UserRole.ADMIN
        ? { assignedUserId: query.userId }
        : {}),
      ...(query.workStatus ? { workStatus: query.workStatus } : {}),
      ...(query.paymentStatus ? { paymentStatus: query.paymentStatus } : {}),
      ...(query.payPlatform ? { payPlatform: query.payPlatform } : {}),
      ...(dateRange(query.year, query.month) ? { workAssignDate: dateRange(query.year, query.month) } : {}),
      ...(query.search
        ? {
            OR: [
              { originalWebsiteLink: { contains: query.search } },
              { flazioWebsiteLink: { contains: query.search } },
              { payoneerPaymentRequestId: { contains: query.search } },
              { invoice: { contains: query.search } }
            ]
          }
        : {})
    };

    const [total, projects] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.findMany({
        where,
        include: {
          assignedUser: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          [query.sortBy]: query.sortOrder
        },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize
      })
    ]);

    return NextResponse.json({
      total,
      page: query.page,
      pageSize: query.pageSize,
      projects: projects.map((project) => {
        const paymentAmount = toNumber(project.paymentAmount);
        const workerPayAmount = toNumber(project.workerPayAmount);
        const ownerCutAmount = toNumber(project.ownerCutAmount);
        const withdrawnAmount = toNumber(project.withdrawnAmount);
        return {
          ...project,
          paymentAmount: paymentAmount.toFixed(2),
          workerPayAmount: workerPayAmount.toFixed(2),
          ownerCutAmount: ownerCutAmount.toFixed(2),
          withdrawnAmount: withdrawnAmount.toFixed(2),
          remainingAmount: (paymentAmount - withdrawnAmount).toFixed(2)
        };
      })
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();

    if (session.user.role !== UserRole.ADMIN) {
      throw new Response("Forbidden", { status: 403 });
    }

    const body = projectCreateSchema.parse(await request.json());
    const assignedUser = await prisma.user.findUnique({
      where: { id: body.assignedUserId },
      select: { name: true }
    });

    if (!assignedUser) {
      throw new Response("Assigned user not found", { status: 400 });
    }

    const payout = calculateProjectPayout({
      workerName: assignedUser.name,
      workAssignDate: body.workAssignDate,
      paymentAmount: body.paymentAmount,
      paymentCurrency: body.paymentCurrency
    });

    const project = await prisma.project.create({
      data: {
        ...body,
        paymentAmount: new Prisma.Decimal(body.paymentAmount),
        workerPayAmount: new Prisma.Decimal(payout.workerPayAmount),
        ownerCutAmount: new Prisma.Decimal(payout.ownerCutAmount),
        withdrawnAmount: new Prisma.Decimal(body.withdrawnAmount),
        paymentRaw:
          body.paymentRaw ??
          `${body.paymentAmount} ${body.paymentCurrency === "EUR" ? "Euro" : "USD"}`
      }
    });

    await writeActivityLog({
      projectId: project.id,
      actorUserId: session.user.id,
      action: ActivityAction.CREATE,
      fieldName: "project",
      newValue: project.id
    });

    return NextResponse.json(serializeProject(project), { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
