"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      aria-label="Sign out"
      title="Sign out"
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-secondary text-secondary-foreground transition hover:bg-muted"
      onClick={() => signOut({ callbackUrl: "/login" })}
      type="button"
    >
      <LogOut size={17} />
    </button>
  );
}
