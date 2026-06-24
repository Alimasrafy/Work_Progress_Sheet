export type IconName =
  | "BarChart3"
  | "Banknote"
  | "FileText"
  | "Gauge"
  | "Landmark"
  | "ListChecks"
  | "Settings"
  | "Users";

export type NavigationItem = {
  href: string;
  label: string;
  icon: IconName;
  adminOnly?: boolean;
};

export const navigationItems: NavigationItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "Gauge" },
  { href: "/total-dashboard", label: "Total Dashboard", icon: "BarChart3" },
  { href: "/projects", label: "Projects", icon: "ListChecks" },
  { href: "/reports", label: "Reports", icon: "BarChart3" },
  { href: "/payments", label: "Payments", icon: "Banknote" },
  { href: "/invoices", label: "Invoices", icon: "FileText" },
  { href: "/payoneer", label: "Payoneer", icon: "Landmark" },
  { href: "/users", label: "Users", icon: "Users", adminOnly: true },
  { href: "/settings", label: "Settings", icon: "Settings", adminOnly: true }
];
