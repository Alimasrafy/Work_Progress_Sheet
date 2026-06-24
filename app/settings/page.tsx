import { UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { ImportForm } from "@/components/projects/import-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/prisma";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return null;
  }

  if (session.user.role !== UserRole.ADMIN) {
    redirect("/dashboard");
  }

  const settings = await prisma.setting.findMany({
    orderBy: { key: "asc" }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Import controls and system-level metadata.
        </p>
      </div>

      <ImportForm />

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold">Stored Settings</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          {settings.map((setting) => (
            <div key={setting.id} className="rounded-md border p-3">
              <p className="text-sm font-medium">{setting.key}</p>
              <pre className="mt-2 overflow-x-auto text-xs text-muted-foreground">
                {JSON.stringify(setting.value, null, 2)}
              </pre>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
