"use client";

import { useRouter } from "next/navigation";

import { PageHeader } from "@punchless/ui/components/page-header";
import { Button } from "@punchless/ui/components/button";
import { DataTable } from "@punchless/ui/components/data-table";
import { Download } from "lucide-react";

import { AuditPill } from "@/components/audit-pill";
import type { AuditLogWithUser } from "@/lib/queries/audit.queries";
import type { ReportPeriod } from "@/lib/utils/report-period";
import {
  formatAuditSummary,
  getAuditActionDisplay,
  getAuditEntityDisplay,
  getAuditSearchText,
} from "@/lib/utils/audit-display";
import { downloadCsv } from "@/lib/utils/export-csv";

interface Props {
  logs: AuditLogWithUser[];
  period: ReportPeriod;
}

const LEGEND = [
  { label: "Added / Credit", tone: "success" as const },
  { label: "Updated", tone: "primary" as const },
  { label: "Paid / Expense", tone: "warning" as const },
  { label: "Deleted / Critical", tone: "destructive" as const },
  { label: "Transfer", tone: "travel" as const },
];

export function AuditLogManager({ logs, period }: Props) {
  const router = useRouter();

  function applyFilter(formData: FormData) {
    const start = String(formData.get("start") || "");
    const end = String(formData.get("end") || "");
    router.push(`/dashboard/audit-log?period=custom&start=${start}&end=${end}`);
  }

  function exportLogs() {
    downloadCsv(
      [
        ["When", "User", "Action", "Entity", "Summary"],
        ...logs.map((row) => {
          const action = getAuditActionDisplay(row.action);
          const entity = getAuditEntityDisplay(row.entity_type);
          return [
            row.created_at ?? "",
            row.user_name ?? row.user_email ?? "System",
            action.label,
            entity?.label ?? row.entity_type ?? "",
            formatAuditSummary(row.action, row.entity_type, row.summary),
          ];
        }),
      ],
      `audit-log-${period.start}-to-${period.end}`
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        description="Owner-only trail of dashboard write actions."
      >
        <Button variant="outline" size="sm" onClick={exportLogs}>
          <Download className="size-4" />
          Export CSV
        </Button>
      </PageHeader>

      <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-card px-4 py-3">
        <span className="mr-1 self-center text-xs font-medium text-muted-foreground">
          Legend:
        </span>
        {LEGEND.map((item) => (
          <AuditPill key={item.label} label={item.label} tone={item.tone} />
        ))}
      </div>

      <form
        action={applyFilter}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4"
      >
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
        <Button type="submit" size="sm">
          Apply
        </Button>
      </form>

      <div className="rounded-xl border border-border bg-card p-5">
        <DataTable
          data={logs}
          getRowKey={(row) => row.id}
          enableSearch
          searchPlaceholder="Search audit log…"
          searchFilter={(row, query) =>
            getAuditSearchText(row.action, row.entity_type, row.summary).includes(
              query
            )
          }
          emptyMessage="No audit entries in this period."
          columns={[
            {
              key: "when",
              header: "When",
              cell: (row) => (
                <span className="text-sm text-muted-foreground">
                  {row.created_at
                    ? new Date(row.created_at).toLocaleString("en-IN")
                    : "—"}
                </span>
              ),
            },
            {
              key: "user",
              header: "User",
              cell: (row) => (
                <span className="font-medium">
                  {row.user_name ?? row.user_email ?? "—"}
                </span>
              ),
            },
            {
              key: "action",
              header: "Action",
              cell: (row) => {
                const display = getAuditActionDisplay(row.action);
                return <AuditPill label={display.label} tone={display.tone} />;
              },
            },
            {
              key: "entity",
              header: "Entity",
              cell: (row) => {
                const display = getAuditEntityDisplay(row.entity_type);
                if (!display) return <span className="text-muted-foreground">—</span>;
                return <AuditPill label={display.label} tone={display.tone} />;
              },
            },
            {
              key: "summary",
              header: "Summary",
              cell: (row) => {
                const text = formatAuditSummary(
                  row.action,
                  row.entity_type,
                  row.summary
                );
                const display = getAuditActionDisplay(row.action);
                const isCritical =
                  display.tone === "destructive" || row.action.includes("deactivate");
                return (
                  <span
                    className={
                      isCritical
                        ? "text-sm text-destructive"
                        : "text-sm text-muted-foreground"
                    }
                  >
                    {text}
                  </span>
                );
              },
            },
          ]}
        />
      </div>
    </div>
  );
}