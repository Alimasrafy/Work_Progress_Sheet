import Link from "next/link";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

type MonthBucket = {
  key: string;
  year: number;
  month: number;
  projects: number;
  pending: number;
  invoices: number;
  revenue: { USD: number; EUR: number };
  remaining: { USD: number; EUR: number };
};

export function MonthList({ months }: { months: MonthBucket[] }) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-semibold">Monthly Views</h2>
      </CardHeader>
      <CardContent className="space-y-2">
        {months.length === 0 ? (
          <p className="text-sm text-muted-foreground">No project months yet.</p>
        ) : (
          months
            .slice()
            .reverse()
            .map((month) => (
              <Link
                key={month.key}
                href={`/months/${month.year}/${String(month.month).padStart(2, "0")}`}
                className="grid grid-cols-[1fr_auto] gap-3 rounded-md border p-3 transition hover:bg-muted"
              >
                <div>
                  <p className="text-sm font-medium">{month.key}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {month.projects} projects, {month.pending} pending, {month.invoices} invoices
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>EUR {month.revenue.EUR.toFixed(0)}</p>
                  <p>USD {month.revenue.USD.toFixed(0)}</p>
                </div>
              </Link>
            ))
        )}
      </CardContent>
    </Card>
  );
}
