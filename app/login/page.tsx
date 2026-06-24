import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { LoginForm } from "@/components/forms/login-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/prisma";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect("/dashboard");
  }

  const setupIssues: string[] = [];

  if (!process.env.DATABASE_URL) {
    setupIssues.push("DATABASE_URL is missing");
  }

  if (!process.env.NEXTAUTH_SECRET) {
    setupIssues.push("NEXTAUTH_SECRET is missing");
  }

  const [projectCount, workerCount, monthCount] = await Promise.all([
    prisma.project.count({ where: { archivedAt: null } }),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.project.aggregate({
      _min: { workAssignDate: true },
      _max: { workAssignDate: true }
    }).then((range) => {
      if (!range._min.workAssignDate || !range._max.workAssignDate) {
        return 0;
      }
      const startYear = range._min.workAssignDate.getUTCFullYear();
      const startMonth = range._min.workAssignDate.getUTCMonth();
      const endYear = range._max.workAssignDate.getUTCFullYear();
      const endMonth = range._max.workAssignDate.getUTCMonth();
      return (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
    })
  ]);

  const demoCredentials = [
    {
      label: "Admin",
      email: process.env.INITIAL_ADMIN_EMAIL ?? "ali@example.com",
      password: process.env.INITIAL_ADMIN_PASSWORD ?? "change-this-password"
    },
    {
      label: "Team Member",
      email: process.env.SONET_EMAIL ?? "sonet@example.com",
      password: process.env.SONET_PASSWORD ?? "change-this-password"
    }
  ];

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.1fr_480px]">
        <section className="hidden rounded-[28px] border border-white/50 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.18),_transparent_30%),linear-gradient(160deg,rgba(255,255,255,0.82),rgba(241,245,249,0.62))] p-10 shadow-soft backdrop-blur-xl lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-5">
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
              Internal Operations
            </p>
            <h1 className="max-w-md text-5xl font-semibold leading-tight tracking-normal">
              Website work, payments, invoices, and Payoneer flow in one place.
            </h1>
            <p className="max-w-md text-base text-muted-foreground">
              The spreadsheet workflow is now modeled as a real operational platform with
              monthly views, audit history, and fast project updates.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-lg border bg-white/70 p-4">
              <p className="text-muted-foreground">Projects</p>
              <p className="mt-2 text-2xl font-semibold">{projectCount}</p>
            </div>
            <div className="rounded-lg border bg-white/70 p-4">
              <p className="text-muted-foreground">Workers</p>
              <p className="mt-2 text-2xl font-semibold">{workerCount}</p>
            </div>
            <div className="rounded-lg border bg-white/70 p-4">
              <p className="text-muted-foreground">Months</p>
              <p className="mt-2 text-2xl font-semibold">{monthCount}</p>
            </div>
          </div>
        </section>

        <Card className="mx-auto w-full max-w-[480px]">
          <CardHeader className="space-y-2">
            <h2 className="text-2xl font-semibold">Sign in</h2>
            <p className="text-sm text-muted-foreground">
              Use the seeded internal credentials or the users you create later from the admin
              panel.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            {setupIssues.length > 0 ? (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-medium">Setup is incomplete</p>
                <p className="mt-1">
                  Login will not work until these items are configured:
                </p>
                <ul className="mt-2 list-disc pl-5">
                  {setupIssues.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <LoginForm />

            <div className="rounded-lg border bg-muted/60 p-4 text-sm">
              <p className="font-medium">Seeded login information</p>
              {demoCredentials.map((credential) => (
                <div key={credential.label} className="mt-3">
                  <p className="text-muted-foreground">{credential.label}</p>
                  <p className="mt-1 font-mono text-xs">Email: {credential.email}</p>
                  <p className="mt-1 font-mono text-xs">Password: {credential.password}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
