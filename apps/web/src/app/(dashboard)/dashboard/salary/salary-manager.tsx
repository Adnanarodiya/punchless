"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@punchless/ui/components/button";
import { Download, Calendar } from "lucide-react";
import type { SalaryReport } from "@/lib/queries/salary.queries";
import { formatCurrency } from "@/lib/utils/formatting";

interface Props {
  report: SalaryReport[];
  currentMonth: string;
  page?: number;
}

export function SalaryManager({ report, currentMonth, page = 1 }: Props) {
  const router = useRouter();
  const [filterText, setFilterText] = useState("");

  const filteredReport = report.filter((r) =>
    r.employee_name.toLowerCase().includes(filterText.toLowerCase())
  );

  const totalGross = filteredReport.reduce((acc, curr) => acc + curr.gross_salary, 0);
  const totalDeductions = filteredReport.reduce((acc, curr) => acc + curr.advance_deduction, 0);
  const totalNet = filteredReport.reduce((acc, curr) => acc + curr.net_salary, 0);

  function handleMonthChange(newMonth: string) {
    router.push(`/dashboard/salary?month=${newMonth}&page=1`);
  }

  function handlePageChange(newPage: number) {
    router.push(`/dashboard/salary?month=${currentMonth}&page=${newPage}`);
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="size-5 text-muted-foreground" />
          <input
            type="month"
            value={currentMonth}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="h-10 px-3 rounded-lg border border-input bg-background text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            placeholder="Search employee..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="h-10 px-3 rounded-lg border border-input bg-background text-sm w-full md:w-64"
          />
          <Button variant="outline">
            <Download className="size-4 mr-2" /> Export
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Gross Salary ({currentMonth})</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(totalGross)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Advance Deductions</p>
          <p className="text-2xl font-bold text-destructive">
            {totalDeductions > 0 ? `−${formatCurrency(totalDeductions)}` : formatCurrency(0)}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Net Salary</p>
          <p className="text-2xl font-bold text-success">{formatCurrency(totalNet)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Total Hours</p>
          <p className="text-2xl font-bold">
            {filteredReport.reduce((acc, curr) => acc + curr.total_hours, 0).toFixed(1)}h
          </p>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground bg-muted/50">
                <th className="p-4 font-medium">Employee</th>
                <th className="p-4 font-medium text-right">₹/hr</th>
                <th className="p-4 font-medium text-right">Workshop (h)</th>
                <th className="p-4 font-medium text-right">On-Site (h)</th>
                <th className="p-4 font-medium text-right">Travel (h)</th>
                <th className="p-4 font-medium text-right">Total Hours</th>
                <th className="p-4 font-medium text-right">Gross</th>
                <th className="p-4 font-medium text-right text-destructive">Advances</th>
                <th className="p-4 font-medium text-right text-success">Net Salary</th>
              </tr>
            </thead>
            <tbody>
              {filteredReport.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground">
                    No salary data found for this month.
                  </td>
                </tr>
              ) : (
                filteredReport.map((r) => (
                  <tr key={r.employee_id} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="p-4 font-medium">{r.employee_name}</td>
                    <td className="p-4 text-right text-muted-foreground">
                      ₹{r.hourly_rate}
                    </td>
                    <td className="p-4 text-right">{r.workshop_hours.toFixed(1)}</td>
                    <td className="p-4 text-right">{r.onsite_hours.toFixed(1)}</td>
                    <td className="p-4 text-right text-muted-foreground">
                      {r.travel_hours.toFixed(1)}
                    </td>
                    <td className="p-4 text-right font-medium">{r.total_hours.toFixed(1)}</td>
                    <td className="p-4 text-right">
                      {formatCurrency(r.gross_salary)}
                    </td>
                    <td className="p-4 text-right text-destructive">
                      {r.advance_deduction > 0
                        ? `−${formatCurrency(r.advance_deduction)}`
                        : "—"}
                    </td>
                    <td className="p-4 text-right font-bold text-success">
                      {formatCurrency(r.net_salary)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {report.length > 0 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
          >
            ← Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page + 1)}
            disabled={report.length < 50}
          >
            Next →
          </Button>
        </div>
      )}
    </div>
  );
}
