import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { userCreateSchema } from "@/lib/validators/user";
import { apiError } from "@/lib/utils/api";

export async function GET() {
  try {
    await requireAdmin();
    const users = await prisma.user.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        _count: {
          select: {
            projects: true
          }
        }
      }
    });

    return NextResponse.json(users);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = userCreateSchema.parse(await request.json());
    const passwordHash = await bcrypt.hash(body.password, 12);

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email.toLowerCase(),
        passwordHash,
        role: body.role ?? UserRole.TEAM_MEMBER
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true
      }
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
