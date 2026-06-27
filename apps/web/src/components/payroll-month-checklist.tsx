"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";

import { Button } from "@punchless/ui/components/button";
import { cn } from "@punchless/ui/lib/utils";
import type { PayrollMonthChecklistData } from "@/lib/queries/payroll-checklist.queries";

type Props = {
  checklist: PayrollMonthChecklistData;
};

function dismissKey(month: string) {
  return `payroll-checklist-dismissed-${month}`;
}

export function PayrollMonthChecklist({ checklist }: Props) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(dismissKey(checklist.salaryMonth));
      setDismissed(stored === "1");
    } catch {
      setDismissed(false);
    }
  }, [checklist.salaryMonth]);

  if (dismissed || checklist.allDone) return null;

  function handleDismiss() {
    try {
      sessionStorage.setItem(dismissKey(checklist.salaryMonth), "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }

  return (
    <section
      aria-labelledby="payroll-checklist-heading"
      className="rounded-xl border border-primary/25 bg-primary/5 p-4 sm:p-5"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 id="payroll-checklist-heading" className="text-base font-semibold">
            Month-end payroll — {checklist.monthLabel}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {checklist.completedCount} of {checklist.totalCount} steps done
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          onClick={handleDismiss}
          aria-label="Dismiss checklist for this month"
        >
          <X className="size-4" />
        </Button>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {checklist.steps.map((step) => (
          <li key={step.id}>
            <Link
              href={step.href}
              className={cn(
                "flex flex-col gap-0.5 rounded-lg border px-3 py-2.5 text-sm transition hover:bg-accent/40",
                step.done
                  ? "border-success/30 bg-success/5 text-foreground"
                  : "border-border bg-card"
              )}
            >
              <span className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border",
                    step.done
                      ? "border-success bg-success text-success-foreground"
                      : "border-muted-foreground/40 text-muted-foreground"
                  )}
                  aria-hidden
                >
                  {step.done ? <Check className="size-3.5" /> : null}
                </span>
                <span className={step.done ? "text-muted-foreground line-through" : "font-medium"}>
                  {step.label}
                </span>
              </span>
              {!step.done && step.id === "review" ? (
                <span className="pl-9 text-xs text-muted-foreground">
                  Opens the salary table — map any unmatched names, then check amounts.
                </span>
              ) : null}
              {!step.done && step.id === "pay" ? (
                <span className="pl-9 text-xs text-muted-foreground">
                  Pay each employee with balance due; paid rows disappear from the list.
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}