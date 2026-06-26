"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@punchless/ui/components/button";
import { Download, Calendar, Banknote, AlertCircle } from "lucide-react";
import type { SalaryReport } from "@/lib/queries/salary.queries";
import type { SalaryMode } from "@/lib/utils/salary-calculation";
import { formatCurrency } from "@/lib/utils/formatting";

interface Props {
  report: SalaryReport[];
  salaryMode: SalaryMode;
  currentMonth: string;
  page?: number;
}

function payDisabledReason(row: SalaryReport): string {
  if (row.over_advanced > 0) {
    return `Over-advanced by ${formatCurrency(row.over_advanced)} — no salary payment due this month`;
  }
  if (row.suggested_pay > 0) return "";
  if (row.already_paid > 0 && row.net_salary > 0) {
    return "Salary already paid for this month";
  }
  if (row.gross_salary <= 0) {
    return "No earnings recorded for this month";
  }
  return "Nothing due to pay";
}

export function SalaryManager({ report, salaryMode, currentMonth, page = 1 }: Props) {
  const router = useRouter();
  const [filterText, setFilterText] = useState("");

  const filteredReport = report.filter((r) =>
    r.employee_name.toLowerCase().includes(filterText.toLowerCase())
  );

  const totalGross = filteredReport.reduce((acc, curr) => acc + curr.gross_salary, 0);
  const totalDeductions = filteredReport.reduce((acc, curr) => acc + curr.advance_deduction, 0);
  const totalDue = filteredReport.reduce((acc, curr) => acc + curr.suggested_pay, 0);
  const totalOverAdvanced = filteredReport.reduce((acc, curr) => acc + curr.over_advanced, 0);

  function handleMonthChange(newMonth: string) {
    router.push(`/dashboard/salary?month=${newMonth}&page=1`);
  }

  function handlePageChange(newPage: number) {
    router.push(`/dashboard/salary?month=${currentMonth}&page=${newPage}`);
  }

  const modeLabel = salaryMode === "fixed" ? "Fixed monthly" : "Hourly";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Calendar className="size-5 text-muted-foreground" />
            <input
              type="month"
              value={currentMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            />
          </div>
          <span className="inline-flex w-fit rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            {modeLabel} · late after grace = half day · absent = no pay
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            placeholder="Search employee..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm md:w-64"
          />
          <Button variant="outline">
            <Download className="mr-2 size-4" /> Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Gross Salary ({currentMonth})</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(totalGross)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Advance Deductions</p>
          <p className="text-2xl font-bold text-destructive">
            {totalDeductions > 0 ? `−${formatCurrency(totalDeductions)}` : formatCurrency(0)}
          </p>
          {totalOverAdvanced > 0 ? (
            <p className="mt-1 text-xs text-warning">
              {formatCurrency(totalOverAdvanced)} over-advanced across staff
            </p>
          ) : null}
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Due to pay</p>
          <p className="text-2xl font-bold text-success">{formatCurrency(totalDue)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            {salaryMode === "fixed" ? "Total day credits" : "Total adjusted hours"}
          </p>
          <p className="text-2xl font-bold">
            {salaryMode === "fixed"
              ? filteredReport
                  .reduce((acc, r) => acc + r.full_days + r.half_days * 0.5, 0)
                  .toFixed(1)
              : `${filteredReport.reduce((acc, r) => acc + r.adjusted_hours, 0).toFixed(1)}h`}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                <th className="p-4 font-medium">Employee</th>
                {salaryMode === "fixed" ? (
                  <>
                    <th className="p-4 text-right font-medium">Full</th>
                    <th className="p-4 text-right font-medium">Half</th>
                    <th className="p-4 text-right font-medium">Absent</th>
                  </>
                ) : (
                  <>
                    <th className="p-4 text-right font-medium">₹/hr</th>
                    <th className="p-4 text-right font-medium">Hours</th>
                    <th className="p-4 text-right font-medium">Adj. hours</th>
                  </>
                )}
                <th className="p-4 text-right font-medium">Gross</th>
                <th className="p-4 text-right font-medium text-destructive">Advances</th>
                <th className="p-4 text-right font-medium">Due</th>
                <th className="p-4 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredReport.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    No salary data found for this month.
                  </td>
                </tr>
              ) : (
                filteredReport.map((r) => {
                  const canPay = r.suggested_pay > 0;
                  const disabledReason = payDisabledReason(r);

                  return (
                    <tr
                      key={r.employee_id}
                      className="border-b border-border last:border-0 hover:bg-muted/50"
                    >
                      <td className="p-4 font-medium">{r.employee_name}</td>
                      {salaryMode === "fixed" ? (
                        <>
                          <td className="p-4 text-right">{r.full_days}</td>
                          <td className="p-4 text-right">{r.half_days}</td>
                          <td className="p-4 text-right text-muted-foreground">{r.absent_days}</td>
                        </>
                      ) : (
                        <>
                          <td className="p-4 text-right text-muted-foreground">₹{r.hourly_rate}</td>
                          <td className="p-4 text-right">{r.total_hours.toFixed(1)}</td>
                          <td className="p-4 text-right font-medium">{r.adjusted_hours.toFixed(1)}</td>
                        </>
                      )}
                      <td className="p-4 text-right">{formatCurrency(r.gross_salary)}</td>
                      <td className="p-4 text-right text-destructive">
                        {r.advance_deduction > 0
                          ? `−${formatCurrency(r.advance_deduction)}`
                          : "—"}
                      </td>
                      <td className="p-4 text-right">
                        <SalaryDueCell row={r} />
                      </td>
                      <td className="p-4 text-right">
                        {canPay ? (
                          <Button variant="outline" size="sm" asChild title={disabledReason}>
                            <Link
                              href={`/dashboard/salary/payments?employee=${r.employee_id}&month=${currentMonth}&openForm=1`}
                            >
                              <Banknote className="size-4" />
                              Pay
                            </Link>
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            title={disabledReason}
                          >
                            <Banknote className="size-4" />
                            Pay
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {report.length > 0 ? (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
          >
            ← Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {page}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page + 1)}
            disabled={report.length < 50}
          >
            Next →
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function SalaryDueCell({ row }: { row: SalaryReport }) {
  if (row.over_advanced > 0) {
    return (
      <div className="inline-flex max-w-[11rem] flex-col items-end gap-0.5 text-warning">
        <span className="inline-flex items-center gap-1 font-medium">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden />
          Over-advanced
        </span>
        <span className="text-xs">by {formatCurrency(row.over_advanced)}</span>
      </div>
    );
  }

  if (row.suggested_pay > 0) {
    return (
      <div className="flex flex-col items-end">
        <span className="font-bold text-success">{formatCurrency(row.suggested_pay)}</span>
        {row.already_paid > 0 ? (
          <span className="text-xs text-muted-foreground">
            {formatCurrency(row.already_paid)} already paid
          </span>
        ) : null}
      </div>
    );
  }

  if (row.already_paid > 0 && row.net_salary >= 0) {
    return <span className="font-medium text-muted-foreground">Paid</span>;
  }

  return <span className="text-muted-foreground">—</span>;
}