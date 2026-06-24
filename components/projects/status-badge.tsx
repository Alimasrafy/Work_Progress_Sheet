import { Badge } from "@/components/ui/badge";

export function StatusBadge({
  value,
  kind
}: {
  value: string | null | undefined;
  kind: "payment" | "work" | "withdraw" | "platform" | "invoice";
}) {
  const normalized = (value ?? "Empty").toUpperCase();

  const tone =
    kind === "payment" && normalized === "PENDING"
      ? "border-amber-300 bg-amber-100 text-amber-800"
      : kind === "payment" && normalized === "DONE"
        ? "border-emerald-300 bg-emerald-100 text-emerald-800"
        : kind === "withdraw" && normalized === "WITHDRAWN"
          ? "border-emerald-300 bg-emerald-100 text-emerald-800"
          : kind === "work" && normalized === "DELIVERED"
            ? "border-sky-300 bg-sky-100 text-sky-800"
            : kind === "platform" && normalized === "PAYONEER"
              ? "border-blue-300 bg-blue-100 text-blue-800"
              : kind === "platform" && normalized === "FIVERR"
                ? "border-violet-300 bg-violet-100 text-violet-800"
                : kind === "invoice" && normalized !== "EMPTY"
                  ? "border-slate-300 bg-slate-100 text-slate-800"
                  : "border-border bg-muted text-muted-foreground";

  return <Badge className={tone}>{value ?? "Empty"}</Badge>;
}
