import { redirectUnlessFullDashboard } from "@/lib/utils/dashboard-experience-guard";
import { ReportLayout, ReportSummaryGrid } from "@/components/report-layout";
import { ReportTable } from "@/components/report-table";
import { getRojmelReport } from "@/lib/queries/report.queries";
import { resolveReportPeriod } from "@/lib/utils/report-period";
import { formatCurrency, formatDate } from "@/lib/utils/formatting";

export default async function RojmelReportPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; start?: string; end?: string }>;
}) {
  await redirectUnlessFullDashboard("/dashboard/reports");
  const params = await searchParams;
  const period = resolveReportPeriod(params);
  const rows = await getRojmelReport(period.start, period.end);

  const closing = rows.length > 0 ? rows[rows.length - 1].balance : 0;
  const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = rows.reduce((s, r) => s + r.credit, 0);

  const exportRows: string[][] = [
    ["Date", "Category", "Remark", "Debit", "Credit", "Balance"],
    ...rows.map((row) => [
      row.date,
      row.category,
      row.remark,
      String(row.debit),
      String(row.credit),
      String(row.balance),
    ]),
  ];

  return (
    <ReportLayout
      title="Rojmel Report"
      description="Daily cash book — every income and expense with a running balance (traditional Rojmel ledger)."
      basePath="/dashboard/reports/rojmel"
      period={period}
      exportRows={exportRows}
      exportFilename={`rojmel-${period.start}-to-${period.end}`}
    >
      <ReportSummaryGrid
        items={[
          { label: "Total debit", value: formatCurrency(totalDebit) },
          { label: "Total credit", value: formatCurrency(totalCredit) },
          { label: "Closing balance", value: formatCurrency(closing) },
        ]}
      />

      <div className="rounded-xl border border-border bg-card p-5">
        <ReportTable
          data={rows}
          getRowKey={(row) => row.id}
          emptyMessage="No ledger entries in this period."
          columns={[
            { key: "date", header: "Date", cell: (row) => formatDate(row.date) },
            { key: "category", header: "Category", cell: (row) => row.category },
            { key: "remark", header: "Remark", cell: (row) => row.remark },
            {
              key: "debit",
              header: "Debit",
              align: "right",
              cell: (row) => (row.debit > 0 ? formatCurrency(row.debit) : "—"),
            },
            {
              key: "credit",
              header: "Credit",
              align: "right",
              cell: (row) => (row.credit > 0 ? formatCurrency(row.credit) : "—"),
            },
            {
              key: "balance",
              header: "Balance",
              align: "right",
              cell: (row) => (
                <span className="font-medium">{formatCurrency(row.balance)}</span>
              ),
            },
          ]}
        />
      </div>
    </ReportLayout>
  );
}