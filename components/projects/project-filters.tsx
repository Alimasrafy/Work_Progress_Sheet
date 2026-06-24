import Link from "next/link";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";

type UserOption = {
  id: string;
  name: string;
};

export function ProjectFilters({
  searchParams,
  users,
  showUserFilter
}: {
  searchParams: Record<string, string | string[] | undefined>;
  users: UserOption[];
  showUserFilter: boolean;
}) {
  return (
    <form className="grid gap-3 rounded-lg border bg-card/82 p-4 shadow-soft backdrop-blur-xl md:grid-cols-2 xl:grid-cols-7">
      <div className="relative xl:col-span-2">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <Input
          className="pl-9"
          defaultValue={typeof searchParams.search === "string" ? searchParams.search : ""}
          name="search"
          placeholder="Search links, invoice, Payoneer ID"
        />
      </div>
      <Input
        defaultValue={typeof searchParams.year === "string" ? searchParams.year : ""}
        name="year"
        placeholder="Year"
        type="number"
      />
      <Input
        defaultValue={typeof searchParams.month === "string" ? searchParams.month : ""}
        max={12}
        min={1}
        name="month"
        placeholder="Month"
        type="number"
      />
      <Select
        defaultValue={typeof searchParams.paymentStatus === "string" ? searchParams.paymentStatus : ""}
        name="paymentStatus"
      >
        <option value="">All Payment Statuses</option>
        <option value="DONE">Done</option>
        <option value="PENDING">Pending</option>
      </Select>
      <Select
        defaultValue={typeof searchParams.payPlatform === "string" ? searchParams.payPlatform : ""}
        name="payPlatform"
      >
        <option value="">All Platforms</option>
        <option value="PAYONEER">Payoneer</option>
        <option value="FIVERR">Fiverr</option>
        <option value="OTHER">Other</option>
      </Select>
      {showUserFilter ? (
        <Select
          defaultValue={typeof searchParams.userId === "string" ? searchParams.userId : ""}
          name="userId"
        >
          <option value="">All Users</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </Select>
      ) : (
        <div />
      )}
      <div className="flex items-center gap-2 xl:col-span-7">
        <Button type="submit">Apply Filters</Button>
        <Link
          className="inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          href="/projects"
        >
          Reset
        </Link>
      </div>
    </form>
  );
}
