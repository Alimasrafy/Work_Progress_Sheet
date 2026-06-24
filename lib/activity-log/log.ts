import type { ActivityAction, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export async function writeActivityLog(input: {
  projectId?: string | null;
  actorUserId?: string | null;
  fieldName?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  action: ActivityAction;
  tx?: Prisma.TransactionClient;
}) {
  const client = input.tx ?? prisma;

  await client.activityLog.create({
    data: {
      projectId: input.projectId ?? null,
      actorUserId: input.actorUserId ?? null,
      fieldName: input.fieldName ?? null,
      oldValue:
        input.oldValue === undefined || input.oldValue === null
          ? null
          : String(input.oldValue),
      newValue:
        input.newValue === undefined || input.newValue === null
          ? null
          : String(input.newValue),
      action: input.action
    }
  });
}
