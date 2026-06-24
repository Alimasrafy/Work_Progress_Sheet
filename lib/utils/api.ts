import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function apiError(error: unknown) {
  if (error instanceof Response) {
    return new NextResponse(error.body, {
      status: error.status,
      statusText: error.statusText
    });
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        message: "Invalid request",
        errors: error.flatten()
      },
      { status: 400 }
    );
  }

  console.error(error);
  return NextResponse.json({ message: "Internal server error" }, { status: 500 });
}

export function toNumber(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return Number(value);
  }

  if (value && typeof value === "object" && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber();
  }

  return 0;
}
