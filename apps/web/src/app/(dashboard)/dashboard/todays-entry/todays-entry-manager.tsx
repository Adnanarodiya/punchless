"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { CalendarDays, FileSpreadsheet, Upload } from "lucide-react";

import { Breadcrumbs } from "@punchless/ui/components/breadcrumbs";
import { Button } from "@punchless/ui/components/button";
import { TablePagination } from "@punchless/ui/components/table-pagination";
import { useTablePagination } from "@punchless/ui/hooks/use-table-pagination";
import { cn } from "@punchless/ui/lib/utils";
import { PageHeader } from "@/components/page-header";
import { TableEmptyState } from "@/components/table-empty-state";
import { MaskedAmount } from "@/components/masked-amount";

import { uploadSalesRegister } from "@/lib/actions/sales-register-import.actions";
import type {
  SalesRegisterImportSummary,
  TodaysEntryReport,
} from "@/lib/queries/sales-register-import.queries";
import { formatDate } from "@/lib/utils/formatting";
import { toast } from "sonner";

type Props = {
  entryDate: string;
  report: TodaysEntryReport;
  savedDays: SalesRegisterImportSummary[];
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayIso() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function buildTodaysEntryUrl(date: string) {
  const params = new URLSearchParams();
  if (date !== yesterdayIso()) params.set("date", date);
  const q = params.toString();
  return q ? `/dashboard/todays-entry?${q}` : "/dashboard/todays-entry";
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

export function TodaysEntryManager({
  entryDate,
  report,
  savedDays,
}: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const tablePagination = useTablePagination(report.lines, {
    resetKey: entryDate,
  });
  const visibleLines = tablePagination.items;

  function handleDateChange(formData: FormData) {
    const date = String(formData.get("entryDate") || todayIso());
    router.push(buildTodaysEntryUrl(date));
  }

  function jumpToDate(date: string) {
    router.push(buildTodaysEntryUrl(date));
  }

  async function onFileSelected(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const result = await uploadSalesRegister(formData);
      if (!result.success) {
        toast.error(result.error ?? "Upload failed");
        return;
      }

      const data = result.data as {
        entryDate?: string;
        alreadyExists?: boolean;
        allDatesSaved?: boolean;
        imported?: number;
        daysImported?: number;
        skippedDays?: number;
        clientsCreated?: number;
        matchedByGst?: number;
        skippedInvoices?: number;
        fileDateRange?: { from: string; to: string };
      };

      if (data.alreadyExists && data.allDatesSaved) {
        toast.message("All days in this file are already saved", {
          description:
            data.skippedDays && data.skippedDays > 0
              ? `${data.skippedDays} day${data.skippedDays === 1 ? "" : "s"} skipped — nothing new to import.`
              : "File was not imported again.",
        });
      } else if (data.imported) {
        const daysPart =
          data.daysImported && data.daysImported > 1
            ? ` across ${data.daysImported} days`
            : data.daysImported === 1
              ? " (1 day)"
              : "";
        toast.success(
          `Imported ${data.imported} bill${data.imported === 1 ? "" : "s"}${daysPart}` +
            (data.clientsCreated ? ` · ${data.clientsCreated} new customers` : "") +
            (data.matchedByGst ? ` · ${data.matchedByGst} matched by GST` : "")
        );
        if (data.skippedDays) {
          toast.message(
            `${data.skippedDays} day${data.skippedDays === 1 ? "" : "s"} already saved — skipped`
          );
        }
        if (data.skippedInvoices) {
          toast.message(`${data.skippedInvoices} duplicate invoice numbers skipped`);
        }
      }

      const targetDate = data.entryDate ?? entryDate;
      if (targetDate !== entryDate) {
        router.push(buildTodaysEntryUrl(targetDate));
      } else {
        router.refresh();
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const thClass =
    "whitespace-nowrap border border-border bg-muted/60 px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide";

  return (
    <div className="space-y-6">
      <Breadcrumbs
        linkComponent={({ href, children, className }) => (
          <Link href={href} className={className}>
            {children}
          </Link>
        )}
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Today's entry" },
        ]}
      />

      <PageHeader
        title="Today's entry"
        description="Upload your Tally sales register — every bill day in the file is imported (one day, one week, or more). Days already saved are skipped."
      />

      <form
        action={handleDateChange}
        className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-card p-4"
      >
        {savedDays.length > 0 ? (
          <div>
            <label htmlFor="savedDay" className="mb-1 block text-sm font-medium">
              Saved days
            </label>
            <select
              id="savedDay"
              defaultValue={savedDays.some((d) => d.entryDate === entryDate) ? entryDate : ""}
              onChange={(e) => {
                if (e.target.value) jumpToDate(e.target.value);
              }}
              className="h-10 min-w-[12rem] rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="" disabled>
                Pick saved day
              </option>
              {savedDays.map((day) => (
                <option key={day.entryDate} value={day.entryDate}>
                  {day.label} ({day.invoiceCount} bills)
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <div>
          <label htmlFor="entryDate" className="mb-1 block text-sm font-medium">
            View date
          </label>
          <input
            id="entryDate"
            name="entryDate"
            type="date"
            required
            defaultValue={entryDate}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
          />
        </div>
        <Button type="submit">Show</Button>
        <Button type="button" variant="outline" onClick={() => jumpToDate(todayIso())}>
          Today
        </Button>
        <Button type="button" variant="outline" onClick={() => jumpToDate(yesterdayIso())}>
          Yesterday
        </Button>
      </form>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <CalendarDays className="size-4 text-muted-foreground" />
              <p className="text-sm font-medium">{formatDate(entryDate)}</p>
              {report.invoiceCount > 0 ? (
                <span className="text-sm text-muted-foreground">
                  — {report.invoiceCount} bills
                </span>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">
              Upload imports all bill days in your
              file — whether that is one day or a full week. Days already saved are skipped; duplicate
              invoice numbers are skipped. Use the date above only to view a specific day.
            </p>
            {report.fileName ? (
              <p className="text-xs text-muted-foreground">
                Last upload: {report.fileName}
                {report.uploadedAt ? ` · ${formatUploadDate(report.uploadedAt)}` : ""}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(event) => void onFileSelected(event.target.files?.[0])}
            />
            <Button onClick={() => fileInputRef.current?.click()} loading={uploading} disabled={uploading}>
              <Upload className="size-4" />
              Upload sales register
            </Button>
          </div>
        </div>

      </div>

      {report.lines.length === 0 ? (
        <TableEmptyState
          icon={FileSpreadsheet}
          title="No sales register entries for this date"
          description="Upload your Sales Register CSV from Tally — all days in the file are imported. Pick a date above to view that day's bills."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">Total billing (credit)</p>
              <p className="text-2xl font-bold text-primary">
                <MaskedAmount amount={report.totalBilling} />
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">Bills imported</p>
              <p className="text-2xl font-bold">{report.invoiceCount}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <table className="w-full min-w-[900px] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className={cn(thClass, "w-10 text-center")}>#</th>
                    <th className={cn(thClass, "min-w-[120px]")}>Invoice</th>
                    <th className={cn(thClass, "min-w-[200px]")}>Customer</th>
                    <th className={cn(thClass)}>GSTIN</th>
                    <th className={cn(thClass, "text-right")}>Amount</th>
                    <th className={cn(thClass, "text-right")}>Credit</th>
                    <th className={cn(thClass, "text-right")}>GST %</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleLines.map((line, index) => (
                    <tr key={line.id} className="hover:bg-muted/30">
                      <td className="border border-border px-2 py-2 text-center tabular-nums text-muted-foreground">
                        {tablePagination.startIndex + index + 1}
                      </td>
                      <td className="border border-border px-2 py-2 font-medium">
                        {line.invoiceNumber ?? "—"}
                      </td>
                      <td className="border border-border px-2 py-2">{line.clientName}</td>
                      <td className="border border-border px-2 py-2 text-xs text-muted-foreground">
                        {line.gstNumber ?? "—"}
                      </td>
                      <td className="border border-border px-2 py-2 text-right tabular-nums">
                        <MaskedAmount amount={line.totalAmount} />
                      </td>
                      <td className="border border-border px-2 py-2 text-right tabular-nums text-warning">
                        <MaskedAmount amount={line.creditAmount} />
                      </td>
                      <td className="border border-border px-2 py-2 text-right tabular-nums">
                        {line.gstPercent > 0 ? `${line.gstPercent}%` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="statement-row-total font-semibold">
                    <td colSpan={4} className="border border-border px-2 py-2 text-right uppercase">
                      Total
                    </td>
                    <td className="border border-border px-2 py-2 text-right">
                      <MaskedAmount amount={report.totalBilling} className="text-primary" />
                    </td>
                    <td colSpan={2} className="border border-border" />
                  </tr>
                </tfoot>
              </table>
            </div>

            <TablePagination
              page={tablePagination.page}
              totalPages={tablePagination.totalPages}
              totalItems={tablePagination.totalItems}
              pageSize={tablePagination.pageSize}
              onPageChange={tablePagination.setPage}
            />
          </div>
        </>
      )}
    </div>
  );
}