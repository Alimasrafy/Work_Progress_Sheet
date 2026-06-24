import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { userPatchSchema } from "@/lib/validators/user";
import { apiError } from "@/lib/utils/api";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = userPatchSchema.parse(await request.json());

    const user = await prisma.user.update({
      where: { id },
      data: {
        name: body.name,
        role: body.role,
        status: body.status,
        passwordHash: body.password ? await bcrypt.hash(body.password, 12) : undefined
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    return apiError(error);
  }
}
