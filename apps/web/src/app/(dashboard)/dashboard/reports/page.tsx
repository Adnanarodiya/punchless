import Link from "next/link";
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

import { PageHeader } from "@punchless/ui/components/page-header";

const reports = [
  {
    href: "/dashboard/reports/daily",
    title: "Daily Summary",
    description: "Income, expense, invoices, and payments for a day or range.",
    icon: BarChart3,
  },
  {
    href: "/dashboard/reports/monthly",
    title: "Monthly Report",
    description: "Month-wise P&L and activity totals.",
    icon: Calendar,
  },
  {
    href: "/dashboard/reports/yearly",
    title: "Yearly Report",
    description: "12-month income vs expense overview.",
    icon: CalendarRange,
  },
  {
    href: "/dashboard/reports/gst",
    title: "GST Report",
    description: "Taxable amount and GST by slab for invoices.",
    icon: Receipt,
  },
  {
    href: "/dashboard/reports/invoices",
    title: "Invoice Report",
    description: "All tax invoices with payment split.",
    icon: FileText,
  },
  {
    href: "/dashboard/reports/income-expense",
    title: "Income / Expense",
    description: "Particular-wise income and expense (Rojmel-style).",
    icon: TrendingUp,
  },
  {
    href: "/dashboard/reports/expenses",
    title: "Expense Report",
    description: "Expense entries only with cash/bank mode.",
    icon: TrendingDown,
  },
  {
    href: "/dashboard/reports/rojmel",
    title: "Rojmel",
    description: "Full ledger with running balance.",
    icon: ScrollText,
  },
];

export default function ReportsIndexPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Shahin-style financial reports — filter by period, print, or export CSV."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Link
              key={report.href}
              href={report.href}
              className="rounded-xl border border-border bg-card p-5 transition hover:border-primary/30 hover:bg-accent/30"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{report.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {report.description}
                  </p>
                </div>
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Icon className="size-5" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}