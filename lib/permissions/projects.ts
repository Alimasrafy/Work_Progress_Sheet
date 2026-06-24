import { UserRole, type Project } from "@prisma/client";
import type { Session } from "next-auth";

import { editableProjectFields, type EditableProjectField } from "@/config/permissions";

export function scopeProjectWhere(session: Session) {
  if (session.user.role === UserRole.ADMIN) {
    return { archivedAt: null };
  }

  return {
    archivedAt: null,
    assignedUserId: session.user.id
  };
}

export function canAccessProject(session: Session, project: Pick<Project, "assignedUserId">) {
  return session.user.role === UserRole.ADMIN || project.assignedUserId === session.user.id;
}

export function assertProjectEditableFields(fields: string[]) {
  const invalid = fields.filter(
    (field) => !editableProjectFields.includes(field as EditableProjectField)
  );

  if (invalid.length > 0) {
    throw new Response(`Fields are not editable: ${invalid.join(", ")}`, {
      status: 400
    });
  }
}
