import { UserRole, UserStatus } from "@prisma/client";
import { z } from "zod";

export const userCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.nativeEnum(UserRole).default(UserRole.TEAM_MEMBER)
});

export const userPatchSchema = z
  .object({
    name: z.string().min(1).optional(),
    role: z.nativeEnum(UserRole).optional(),
    status: z.nativeEnum(UserStatus).optional(),
    password: z.string().min(8).optional()
  })
  .strict();
