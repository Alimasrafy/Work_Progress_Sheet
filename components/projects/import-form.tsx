"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ImportForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/import/spreadsheet", {
        method: "POST",
        body: formData
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage(payload?.message ?? "Import failed");
        return;
      }

      setMessage(
        `Imported ${payload.imported} rows, skipped ${payload.skipped}${payload.warnings?.length ? `, warnings: ${payload.warnings.length}` : ""}.`
      );

      router.refresh();
    });
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-3 rounded-lg border bg-card/82 p-4 shadow-soft backdrop-blur-xl md:flex-row md:items-center">
      <Input accept=".xlsx,.xls" name="file" type="file" />
      <Button disabled={isPending} type="submit">
        {isPending ? "Importing..." : "Import Spreadsheet"}
      </Button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </form>
  );
}
