"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@punchless/ui/components/button";
import { TablePagination } from "@punchless/ui/components/table-pagination";
import { useTablePagination } from "@punchless/ui/hooks/use-table-pagination";
import { cn } from "@punchless/ui/lib/utils";
import {
  AlertCircle,
  Banknote,
  Calendar,
  Download,
  FileSpreadsheet,
  Upload,
  Users,
} from "lucide-react";
import { IconTooltip } from "@/components/icon-tooltip";
import { MaskedAmount } from "@/components/masked-amount";
import { TableEmptyState } from "@/components/table-empty-state";
import { FingerprintNameMapModal } from "@/components/fingerprint-name-map-modal";
import { stickyFirstTdClass, stickyFirstThClass } from "@/lib/constants/table-styles";
import { uploadFingerprintAttendance } from "@/lib/actions/attendance-import.actions";
import type { AttendanceImportSummary } from "@/lib/queries/attendance-import.queries";

import {
  buildFingerprintExportRows,
  fingerprintExportFilename,
  type FingerprintSalaryReport,
} from "@/lib/utils/fingerprint-salary-report";
import { downloadCsv } from "@/lib/utils/export-csv";
import {
  downloadCsvFallback,
  downloadXlsx,
} from "@/lib/utils/export-xlsx";
import { formatCurrency } from "@/lib/utils/formatting";
import { toast } from "sonner";

type Props = {
  currentMonth: string;
  report: FingerprintSalaryReport | null;
  savedMonths: AttendanceImportSummary[];
  employeesForMapping: Array<{ id: string; fullName: string }>;
  /** When true, Pay opens modal on Pay Staff hub (no page navigation). */
  unifiedPayStaff?: boolean;
  /** Opens pay modal with prefilled amount (Simple Pay Staff hub). */
  onPayEmployee?: (employeeId: string, amount: number) => void;
};

function buildPayHref(
  unifiedPayStaff: boolean,
  employeeId: string,
  month: string,
  amount: number
) {
  if (unifiedPayStaff) {
    const params = new URLSearchParams({
      month,
      employee: employeeId,
      openPay: "1",
      amount: String(Math.round(amount)),
    });
    return `/dashboard/salary?${params.toString()}`;
  }
  const params = new URLSearchParams({
    employee: employeeId,
    month,
    openForm: "1",
    amount: String(Math.round(amount)),
  });
  return `/dashboard/salary/payments?${params.toString()}`;
}

function formatUploadDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function FingerprintSalarySection({
  currentMonth,
  report,
  savedMonths,
  employeesForMapping,
  unifiedPayStaff = false,
  onPayEmployee,
}: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filterText, setFilterText] = useState("");
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [mapTarget, setMapTarget] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);

  function handleMonthChange(newMonth: string) {
    router.push(`/dashboard/salary?month=${newMonth}`);
  }

  const lines = (report?.lines ?? []).filter((line) =>
    line.employeeName.toLowerCase().includes(filterText.toLowerCase())
  );

  const tablePagination = useTablePagination(lines, { resetKey: filterText });
  const visibleLines = tablePagination.items;

  const totalEarned = lines.reduce((sum, line) => sum + line.earnedSalary, 0);
  const totalOt = lines.reduce((sum, line) => sum + line.otPay, 0);
  const totalAdvance = lines.reduce((sum, line) => sum + line.advanceDeduction, 0);
  const totalDue = lines.reduce((sum, line) => sum + line.suggestedPay, 0);

  function triggerFilePicker() {
    fileInputRef.current?.click();
  }

  async function onFileSelected(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const result = await uploadFingerprintAttendance(formData);
      if (!result.success) {
        toast.error(result.error ?? "Upload failed");
        return;
      }
      const data = result.data as
        | {
            salaryMonth?: string;
            alreadyExists?: boolean;
            fileName?: string;
            employeeCount?: number;
          }
        | undefined;
      const uploadedMonth = data?.salaryMonth;

      if (data?.alreadyExists) {
        const label =
          savedMonths.find((m) => m.salaryMonth === uploadedMonth)?.label ??
          uploadedMonth;
        toast.message(`Attendance for ${label} is already saved`, {
          description: "Opening saved data — file was not uploaded again.",
        });
      } else {
        toast.success(
          uploadedMonth && uploadedMonth !== currentMonth
            ? `Attendance saved — showing ${uploadedMonth}`
            : "Attendance uploaded — salary report ready."
        );
      }

      if (uploadedMonth && uploadedMonth !== currentMonth) {
        router.push(`/dashboard/salary?month=${uploadedMonth}`);
      } else {
        router.refresh();
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleExport(ext: "csv" | "xlsx") {
    if (!report || lines.length === 0) {
      toast.error("Upload attendance first to export the salary report.");
      return;
    }

    const rows = buildFingerprintExportRows(
      { ...report, lines },
      currentMonth
    );

    if (ext === "csv") {
      setExportingCsv(true);
      try {
        downloadCsv(rows, fingerprintExportFilename(currentMonth, "csv"));
      } finally {
        setExportingCsv(false);
      }
      return;
    }

    setExportingExcel(true);
    try {
      try {
        await downloadXlsx(rows, fingerprintExportFilename(currentMonth, "xlsx"));
      } catch {
        downloadCsvFallback(rows, fingerprintExportFilename(currentMonth, "csv"));
        toast.message("Excel unavailable — downloaded CSV instead");
      }
    } finally {
      setExportingExcel(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold">Fingerprint attendance upload</h2>
              <div className="flex flex-wrap items-center gap-2">
                <Calendar className="size-4 text-muted-foreground" />
                {savedMonths.length > 0 ? (
                  <select
                    value={
                      savedMonths.some((m) => m.salaryMonth === currentMonth)
                        ? currentMonth
                        : ""
                    }
                    onChange={(e) => {
                      if (e.target.value) handleMonthChange(e.target.value);
                    }}
                    className="h-9 min-w-[12rem] rounded-lg border border-input bg-background px-3 text-sm"
                    aria-label="Saved attendance month"
                  >
                    <option value="" disabled>
                      Saved months
                    </option>
                    {savedMonths.map((month) => (
                      <option key={month.salaryMonth} value={month.salaryMonth}>
                        {month.label} ({month.employeeCount} staff)
                      </option>
                    ))}
                  </select>
                ) : null}
                <input
                  type="month"
                  value={currentMonth}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
                  aria-label="Salary month"
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Upload reads the month from the file. Each month is saved once — uploading the
              same month again opens the saved report without re-importing.
            </p>
            {report?.fileName ? (
              <p className="text-xs text-muted-foreground">
                Last upload: {report.fileName}
                {report.uploadedAt
                  ? ` · ${new Date(report.uploadedAt).toLocaleString("en-IN")}`
                  : ""}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(event) => void onFileSelected(event.target.files?.[0])}
            />
            <Button onClick={triggerFilePicker} loading={uploading} disabled={uploading}>
              <Upload className="size-4" />
              Upload attendance
            </Button>
            <IconTooltip label="Export CSV">
              <Button
                variant="outline"
                onClick={() => void handleExport("csv")}
                loading={exportingCsv}
                disabled={!report || exportingCsv || exportingExcel}
              >
                <Download className="size-4" />
                <span className="hidden sm:inline">Export CSV</span>
              </Button>
            </IconTooltip>
            <IconTooltip label="Export Excel">
              <Button
                variant="outline"
                onClick={() => void handleExport("xlsx")}
                loading={exportingExcel}
                disabled={!report || exportingCsv || exportingExcel}
              >
                <FileSpreadsheet className="size-4" />
                <span className="hidden sm:inline">Export Excel</span>
              </Button>
            </IconTooltip>
          </div>
        </div>

        {report && report.unmatchedCount > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
            <AlertCircle className="size-4 shrink-0" />
            <span>
              {report.unmatchedCount} fingerprint name
              {report.unmatchedCount === 1 ? "" : "s"} not matched — map them to employees below.
            </span>
          </div>
        ) : null}

        {report ? (
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-muted px-2.5 py-1">
              OT @ {report.otRateMultiplier}×
            </span>
            <span className="rounded-full bg-muted px-2.5 py-1">
              Eligible days: {report.eligibleDays}
            </span>
            <span className="rounded-full bg-muted px-2.5 py-1">
              Sundays excluded from absent penalty
            </span>
          </div>
        ) : null}

        {savedMonths.length > 0 ? (
          <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
            <p className="mb-3 text-sm font-medium">Saved attendance uploads</p>
            <ul className="space-y-2">
              {savedMonths.map((month) => (
                <li key={month.salaryMonth}>
                  <button
                    type="button"
                    onClick={() => handleMonthChange(month.salaryMonth)}
                    className={cn(
                      "flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:bg-accent/50",
                      month.salaryMonth === currentMonth
                        ? "border-primary/40 bg-primary/5"
                        : "border-border bg-card"
                    )}
                  >
                    <span className="font-medium">{month.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {month.employeeCount} staff · {month.fileName}
                    </span>
                    <span className="w-full text-xs text-muted-foreground sm:w-auto sm:text-right">
                      {formatUploadDate(month.uploadedAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {!report ? (
        <TableEmptyState
          icon={Upload}
          title="No fingerprint attendance for this month"
          description="Upload your monthly fingerprint export (.xlsx) to calculate working days, OT, and net salary for each employee."
        />
      ) : (
        <section id="salary-report" className="scroll-mt-24 space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">Earned salary</p>
              <p className="text-2xl font-bold text-primary">
                <MaskedAmount amount={totalEarned} />
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">OT pay</p>
              <p className="text-2xl font-bold text-primary">
                <MaskedAmount amount={totalOt} />
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">Advance deductions</p>
              <p className="text-2xl font-bold text-destructive">
                <MaskedAmount
                  amount={totalAdvance}
                  format={(n) => (n > 0 ? `−${formatCurrency(n)}` : formatCurrency(0))}
                />
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">Pay this month</p>
              <p className="text-2xl font-bold text-success">
                <MaskedAmount amount={totalDue} />
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              placeholder="Search employee..."
              value={filterText}
              onChange={(event) => setFilterText(event.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm md:w-64"
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                    <th className={cn("p-4 font-medium", stickyFirstThClass)}>#</th>
                    <th className={cn("p-4 font-medium", stickyFirstThClass)}>Name</th>
                    <th className="p-4 font-medium">Designation</th>
                    <th className="p-4 text-right font-medium">Salary</th>
                    <th className="p-4 text-right font-medium">Working Days</th>
                    <th className="p-4 text-right font-medium">OT (hrs)</th>
                    <th className="p-4 text-right font-medium">Earned</th>
                    <th className="p-4 text-right font-medium">OT pay</th>
                    <th className="p-4 text-right font-medium">Total</th>
                    <th className="p-4 text-right font-medium text-destructive">Advance</th>
                    <th className="p-4 text-right font-medium">Net pay</th>
                    <th className="p-4 text-right font-medium">Pay this month</th>
                    <th className="p-4 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.length === 0 ? (
                    <tr>
                      <td colSpan={13}>
                        <TableEmptyState
                          icon={Users}
                          title="No employees match your search"
                          description="Try a different name or clear the search box."
                        />
                      </td>
                    </tr>
                  ) : (
                    visibleLines.map((line, index) => (
                      <tr
                        key={line.importRowId ?? `${line.fingerprintName}-${index}`}
                        className="group border-b border-border last:border-0 hover:bg-muted/50"
                      >
                        <td className={cn("p-4 text-muted-foreground", stickyFirstTdClass)}>
                          {tablePagination.startIndex + index + 1}
                        </td>
                        <td className={cn("p-4 font-medium", stickyFirstTdClass)}>
                          <div className="flex flex-col gap-0.5">
                            <span>{line.employeeName}</span>
                            {!line.isMatched ? (
                              <span className="text-xs text-warning">Not matched</span>
                            ) : null}
                          </div>
                        </td>
                        <td className="p-4 text-muted-foreground">{line.designation ?? "—"}</td>
                        <td className="p-4 text-right">
                          <MaskedAmount amount={line.monthlySalary} />
                        </td>
                        <td className="p-4 text-right font-medium">{line.workingDays}</td>
                        <td className="p-4 text-right">{line.otHours.toFixed(2)}</td>
                        <td className="p-4 text-right">
                          <MaskedAmount amount={line.earnedSalary} />
                        </td>
                        <td className="p-4 text-right">
                          <MaskedAmount amount={line.otPay} />
                        </td>
                        <td className="p-4 text-right font-medium">
                          <MaskedAmount amount={line.totalSalary} />
                        </td>
                        <td className="p-4 text-right text-destructive">
                          {line.advanceDeduction > 0 ? (
                            <MaskedAmount
                              amount={line.advanceDeduction}
                              format={(n) => `−${formatCurrency(n)}`}
                            />
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="p-4 text-right font-medium">
                          <MaskedAmount amount={line.netPayment} />
                        </td>
                        <td className="p-4 text-right font-semibold text-success">
                          {line.isMatched && line.suggestedPay > 0 ? (
                            <MaskedAmount amount={line.suggestedPay} />
                          ) : line.isMatched && line.alreadyPaid > 0 ? (
                            <span className="text-xs font-medium text-muted-foreground">
                              Paid
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {!line.isMatched ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setMapTarget(line.fingerprintName)}
                            >
                              Map
                            </Button>
                          ) : line.suggestedPay > 0 ? (
                            unifiedPayStaff && onPayEmployee ? (
                              <Button
                                size="sm"
                                onClick={() =>
                                  onPayEmployee(line.employeeId!, line.suggestedPay)
                                }
                              >
                                <Banknote className="size-4" />
                                Pay
                              </Button>
                            ) : (
                              <Button size="sm" asChild>
                                <Link
                                  href={buildPayHref(
                                    unifiedPayStaff,
                                    line.employeeId!,
                                    currentMonth,
                                    line.suggestedPay
                                  )}
                                >
                                  <Banknote className="size-4" />
                                  Pay
                                </Link>
                              </Button>
                            )
                          ) : line.isMatched && line.alreadyPaid > 0 ? (
                            <span className="inline-flex items-center rounded-md border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                              Paid
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {lines.length > 0 ? (
              <div className="border-t border-border px-4 py-3">
                <TablePagination
                  page={tablePagination.page}
                  totalPages={tablePagination.totalPages}
                  totalItems={tablePagination.totalItems}
                  pageSize={tablePagination.pageSize}
                  onPageChange={tablePagination.setPage}
                />
              </div>
            ) : null}
          </div>
        </section>
      )}

      <FingerprintNameMapModal
        open={mapTarget != null}
        onOpenChange={(open) => {
          if (!open) setMapTarget(null);
        }}
        fingerprintName={mapTarget ?? ""}
        salaryMonth={currentMonth}
        employees={employeesForMapping}
        onMapped={() => router.refresh()}
      />
    </div>
  );
}