import Link from "next/link";
import {
  Banknote,
  CalendarCheck,
  ClipboardCheck,
  Clock,
  FileEdit,
  Wallet,
} from "lucide-react";

import { cn } from "@punchless/ui/lib/utils";

const steps = [
  {
    step: 1,
    label: "Attendance",
    hint: "Staff punch in on mobile",
    href: "/dashboard/attendance",
    icon: Clock,
  },
  {
    step: 2,
    label: "Fix requests",
    hint: "Approve corrections",
    href: "/dashboard/requests",
    icon: FileEdit,
  },
  {
    step: 3,
    label: "Salary report",
    hint: "Review due amounts",
    href: "/dashboard/salary",
    icon: CalendarCheck,
    current: true,
  },
  {
    step: 4,
    label: "Pay staff",
    hint: "Record cash/bank payout",
    href: "/dashboard/salary/payments",
    icon: Banknote,
  },
];

/** Monthly payroll path — shown on the Salary page. */
export function PayrollFlowPanel({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-card p-4 sm:p-5",
        className
      )}
      aria-labelledby="payroll-flow-heading"
    >
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="payroll-flow-heading" className="text-sm font-semibold text-foreground">
            How monthly payroll works
          </h2>
          <p className="text-xs text-muted-foreground">
            Follow these steps in order each month. Advances reduce the due on step 3.
          </p>
        </div>
        <Link
          href="/dashboard/advances"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          <Wallet className="size-3.5" />
          Manage advances
        </Link>
      </div>

      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.step}>
              <Link
                href={item.href}
                className={cn(
                  "flex h-full flex-col rounded-lg border p-3 transition hover:border-primary/30 hover:bg-accent/30",
                  item.current
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-muted/20"
                )}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
                    {item.step}
                  </span>
                  <Icon className="size-4 text-muted-foreground" aria-hidden />
                </div>
                <span className="text-sm font-medium text-foreground">{item.label}</span>
                <span className="mt-0.5 text-xs text-muted-foreground">{item.hint}</span>
              </Link>
            </li>
          );
        })}
      </ol>

      <p className="mt-3 text-xs text-muted-foreground">
        <ClipboardCheck className="mr-1 inline size-3.5" aria-hidden />
        Tip: open{" "}
        <Link href="/dashboard/history" className="font-medium text-foreground hover:underline">
          History
        </Link>{" "}
        before step 3 to verify hours and days for the month.
      </p>
    </section>
  );
}