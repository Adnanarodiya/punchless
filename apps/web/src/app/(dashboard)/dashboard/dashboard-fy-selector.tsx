"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { cn } from "@punchless/ui/lib/utils";

import type { FinancialYearOption } from "@/lib/utils/financial-year";
import { getCurrentFinancialYearStartYear } from "@/lib/utils/financial-year";

interface Props {
  options: FinancialYearOption[];
  selectedFy: number;
}

export function DashboardFySelector({ options, selectedFy }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentFy = getCurrentFinancialYearStartYear();

  if (options.length === 0) return null;

  function setFy(year: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (year === currentFy) {
      params.delete("fy");
    } else {
      params.set("fy", String(year));
    }
    router.push(`/dashboard?${params.toString()}`);
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
      <label className="flex items-center gap-2 text-sm">
        <span className="text-xs text-muted-foreground">Indian FY</span>
        <select
        value={String(selectedFy)}
        onChange={(e) => setFy(Number(e.target.value))}
        className={cn(
          "h-9 min-w-[8.5rem] cursor-pointer rounded-lg border border-input bg-background px-3 text-sm font-medium",
          "focus:outline-none focus:ring-2 focus:ring-ring"
        )}
        aria-label="Financial year"
      >
        {options.map((opt) => (
          <option key={opt.value} value={String(opt.value)}>
            {opt.label}
          </option>
        ))}
        </select>
      </label>
      <p className="text-[10px] text-muted-foreground">1 Apr – 31 Mar</p>
    </div>
  );
}