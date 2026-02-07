"use client";

import { useState } from "react";
import { Button } from "@punchless/ui/components/button";
import { Download, Calendar } from "lucide-react";
import type { SalaryReport } from "@/lib/queries/salary.queries";
import { formatCurrency } from "@/lib/utils/formatting";

interface Props {
  report: SalaryReport[];
}

export function SalaryManager({ report }: Props) {
  const [month, setMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  });

  const [filterText, setFilterText] = useState("");

  const filteredReport = report.filter((r) =>
    r.employee_name.toLowerCase().includes(filterText.toLowerCase())
  );

  const totalSalary = filteredReport.reduce((acc, curr) => acc + curr.total_salary, 0);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="size-5 text-muted-foreground" />
          <input
            type="month"
            value={month}
            onChange={(e) => {
              setMonth(e.target.value);
              // In a real app, this would trigger a re-fetch (server action or router refresh)
              // For now, it's just local state for UI demo
            }}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Total Salary ({month})</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(totalSalary)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Total Hours</p>
          <p className="text-2xl font-bold">
            {filteredReport.reduce((acc, curr) => acc + curr.total_hours, 0).toFixed(1)}h
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Avg. Salary / Emp</p>
          <p className="text-2xl font-bold">
            {filteredReport.length > 0
              ? formatCurrency(totalSalary / filteredReport.length)
              : formatCurrency(0)}
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
                <th className="p-4 font-medium text-right">Rate (₹/hr)</th>
                <th className="p-4 font-medium text-right">Workshop (h)</th>
                <th className="p-4 font-medium text-right">On-Site (h)</th>
                <th className="p-4 font-medium text-right">Travel (h)</th>
                <th className="p-4 font-medium text-right">Total Hours</th>
                <th className="p-4 font-medium text-right text-primary">Est. Salary</th>
              </tr>
            </thead>
            <tbody>
              {filteredReport.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
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
                    <td className="p-4 text-right font-bold text-primary">
                      {formatCurrency(r.total_salary)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
