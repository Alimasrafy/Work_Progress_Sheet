import { UserRole } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { AppShellNav } from "@/components/layout/app-shell-nav";
import { navigationItems } from "@/config/navigation";
import { authOptions } from "@/lib/auth/options";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const items = navigationItems.filter(
    (item) => !item.adminOnly || session.user.role === UserRole.ADMIN
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="border-r bg-card/72 backdrop-blur-xl lg:sticky lg:top-0 lg:h-screen">
        <div className="flex h-16 items-center border-b px-5">
          <Link href="/dashboard" className="text-base font-semibold">
            Work Progress
          </Link>
        </div>
        <AppShellNav items={items} />
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/78 px-4 backdrop-blur-xl md:px-6">
          <div>
            <p className="text-sm font-medium">{session.user.name}</p>
            <p className="text-xs text-muted-foreground">
              {session.user.role === UserRole.ADMIN ? "Admin" : "Team Member"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <SignOutButton />
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1480px] px-4 py-6 md:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
