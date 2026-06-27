import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Calendar,
  CalendarRange,
  FileText,
  Receipt,
  ScrollText,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

export type ReportNavTier = "simple" | "full";

export type ReportNavItem = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tier: ReportNavTier;
};

export const REPORT_NAV_ITEMS: ReportNavItem[] = [
  {
    href: "/dashboard/daily-report",
    title: "Daily report",
    description: "Rojmel-style — income, expense, advances, and all payments for one day.",
    icon: BarChart3,
    tier: "simple",
  },
  {
    href: "/dashboard/reports/monthly",
    title: "Monthly Report",
    description: "Month-wise P&L and activity totals.",
    icon: Calendar,
    tier: "simple",
  },
  {
    href: "/dashboard/reports/yearly",
    title: "Yearly Report",
    description: "12-month income vs expense overview.",
    icon: CalendarRange,
    tier: "full",
  },
  {
    href: "/dashboard/reports/gst",
    title: "GST Report",
    description: "Taxable amount and GST by slab for invoices.",
    icon: Receipt,
    tier: "full",
  },
  {
    href: "/dashboard/reports/invoices",
    title: "Invoice Report",
    description: "All tax invoices with payment split.",
    icon: FileText,
    tier: "full",
  },
  {
    href: "/dashboard/reports/income-expense",
    title: "Income / Expense",
    description: "Particular-wise income and expense from manual entries.",
    icon: TrendingUp,
    tier: "full",
  },
  {
    href: "/dashboard/reports/expenses",
    title: "Expense Report",
    description: "Expense entries only with cash/bank mode.",
    icon: TrendingDown,
    tier: "full",
  },
  {
    href: "/dashboard/reports/rojmel",
    title: "Daily cash book",
    description: "Rojmel — every money movement with running balance.",
    icon: ScrollText,
    tier: "full",
  },
];

export function filterReportsForExperience(
  experience: "simple" | "full"
): ReportNavItem[] {
  if (experience === "full") {
    return REPORT_NAV_ITEMS;
  }
  return REPORT_NAV_ITEMS.filter((item) => item.tier === "simple");
}