import { UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/options";

export async function requireSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  return session;
}

export async function requireAdmin() {
  const session = await requireSession();

  if (session.user.role !== UserRole.ADMIN) {
    throw new Response("Forbidden", { status: 403 });
  }

  return session;
}
