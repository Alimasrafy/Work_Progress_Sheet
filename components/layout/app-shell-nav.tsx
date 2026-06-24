"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Banknote,
  FileText,
  Gauge,
  Landmark,
  ListChecks,
  Settings,
  Users
} from "lucide-react";
import type { NavigationItem } from "@/config/navigation";

type NavItem = NavigationItem;

const iconMap: Record<NavigationItem["icon"], React.ComponentType<{ size?: number }>> = {
  BarChart3,
  Banknote,
  FileText,
  Gauge,
  Landmark,
  ListChecks,
  Settings,
  Users
};

export function AppShellNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto px-3 py-3 lg:block lg:space-y-1 lg:overflow-visible">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`inline-flex h-10 shrink-0 items-center gap-3 rounded-md px-3 text-sm transition lg:flex ${
              isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {React.createElement(iconMap[item.icon], { size: 17 })}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
