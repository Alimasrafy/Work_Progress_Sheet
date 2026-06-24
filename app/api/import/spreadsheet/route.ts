import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/session";
import { importSpreadsheet } from "@/lib/import/spreadsheet";
import { apiError } from "@/lib/utils/api";

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new Response("Spreadsheet file is required", { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await importSpreadsheet({
      fileBuffer: buffer,
      actorUserId: session.user.id
    });

    return NextResponse.json(result);
  } catch (error) {
    return apiError(error);
  }
}
