"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Printer } from "lucide-react";

import { Breadcrumbs } from "@punchless/ui/components/breadcrumbs";
import { Button } from "@punchless/ui/components/button";
import { PageHeader } from "@punchless/ui/components/page-header";
import { cn } from "@punchless/ui/lib/utils";

import { downloadCsv } from "@/lib/utils/export-csv";
import type { ReportPeriod, ReportPreset } from "@/lib/utils/report-period";

type PeriodMode = "range" | "month" | "year";

interface Props {
  title: string;
  description: string;
  basePath: string;
  period: ReportPeriod;
  periodMode?: PeriodMode;
  exportRows?: string[][];
  exportFilename?: string;
  children: React.ReactNode;
}

const RANGE_PRESETS: { id: ReportPreset; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
];

export function ReportLayout({
  title,
  description,
  basePath,
  period,
  periodMode = "range",
  exportRows,
  exportFilename,
  children,
}: Props) {
  const router = useRouter();

  function navigatePreset(preset: ReportPreset) {
    router.push(`${basePath}?period=${preset}`);
  }

  function applyCustomRange(formData: FormData) {
    const start = String(formData.get("start") || "");
    const end = String(formData.get("end") || "");
    router.push(`${basePath}?period=custom&start=${start}&end=${end}`);
  }

  function applyMonth(formData: FormData) {
    const month = String(formData.get("month") || "");
    router.push(`${basePath}?month=${month}`);
  }

  function applyYear(formData: FormData) {
    const year = String(formData.get("year") || "");
    router.push(`${basePath}?year=${year}`);
  }

  const defaultMonth = period.start.slice(0, 7);
  const defaultYear = period.start.slice(0, 4);

  return (
    <div className="space-y-6 print:space-y-4">
      <Breadcrumbs
        linkComponent={({ href, children: label, className }) => (
          <Link href={href} className={className}>
            {label}
          </Link>
        )}
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Reports", href: "/dashboard/reports" },
          { label: title },
        ]}
      />

      <PageHeader title={title} description={description}>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="size-4" />
            Print
          </Button>
          {exportRows && exportRows.length > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                downloadCsv(
                  exportRows,
                  exportFilename ?? title.toLowerCase().replace(/\s+/g, "-")
                )
              }
            >
              <Download className="size-4" />
              Export CSV
            </Button>
          ) : null}
        </div>
      </PageHeader>

      <div className="rounded-xl border border-border bg-card p-4 print:hidden">
        <p className="mb-3 text-sm text-muted-foreground">
          Period: <span className="font-medium text-foreground">{period.label}</span>
          {" "}({period.start} → {period.end})
        </p>

        {periodMode === "range" ? (
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex gap-1 rounded-lg bg-muted p-1">
              {RANGE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => navigatePreset(p.id)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    period.preset === p.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <form action={applyCustomRange} className="flex flex-wrap items-end gap-2">
              <div>
                <label htmlFor="start" className="mb-1 block text-xs font-medium">
                  From
                </label>
                <input
                  id="start"
                  name="start"
                  type="date"
                  required
                  defaultValue={period.start}
                  className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="end" className="mb-1 block text-xs font-medium">
                  To
                </label>
                <input
                  id="end"
                  name="end"
                  type="date"
                  required
                  defaultValue={period.end}
                  className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
                />
              </div>
              <Button type="submit" size="sm" variant="secondary">
                Apply
              </Button>
            </form>
          </div>
        ) : null}

        {periodMode === "month" ? (
          <form action={applyMonth} className="flex items-end gap-2">
            <div>
              <label htmlFor="month" className="mb-1 block text-xs font-medium">
                Month
              </label>
              <input
                id="month"
                name="month"
                type="month"
                required
                defaultValue={defaultMonth}
                className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
              />
            </div>
            <Button type="submit" size="sm">
              Apply
            </Button>
          </form>
        ) : null}

        {periodMode === "year" ? (
          <form action={applyYear} className="flex items-end gap-2">
            <div>
              <label htmlFor="year" className="mb-1 block text-xs font-medium">
                Year
              </label>
              <input
                id="year"
                name="year"
                type="number"
                min={2020}
                max={2035}
                required
                defaultValue={defaultYear}
                className="h-9 w-28 rounded-lg border border-input bg-background px-2 text-sm"
              />
            </div>
            <Button type="submit" size="sm">
              Apply
            </Button>
          </form>
        ) : null}
      </div>

      {children}
    </div>
  );
}

export function ReportSummaryGrid({
  items,
}: {
  items: { label: string; value: string; hint?: string }[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-border bg-card p-4"
        >
          <p className="text-sm text-muted-foreground">{item.label}</p>
          <p className="text-2xl font-bold">{item.value}</p>
          {item.hint ? (
            <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}