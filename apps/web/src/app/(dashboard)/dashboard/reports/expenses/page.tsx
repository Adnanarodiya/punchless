import { ReportLayout, ReportSummaryGrid } from "@/components/report-layout";
import { ReportTable } from "@/components/report-table";
import { getExpenseReport } from "@/lib/queries/report.queries";
import { resolveReportPeriod } from "@/lib/utils/report-period";
import { formatCurrency, formatDate } from "@/lib/utils/formatting";

export default async function ExpenseReportPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; start?: string; end?: string }>;
}) {
  const params = await searchParams;
  const period = resolveReportPeriod(params);
  const rows = await getExpenseReport(period.start, period.end);
  const total = rows.reduce((s, r) => s + r.amount, 0);

  const exportRows: string[][] = [
    ["Date", "Particular", "Amount", "Mode", "Bank", "Remark"],
    ...rows.map((row) => [
      row.date,
      row.particular,
      String(row.amount),
      row.paymentMode,
      row.bankName ?? "",
      row.remark ?? "",
    ]),
  ];

  return (
    <ReportLayout
      title="Expense Report"
      description="All expense entries for the selected period."
      basePath="/dashboard/reports/expenses"
      period={period}
      exportRows={exportRows}
      exportFilename={`expenses-${period.start}-to-${period.end}`}
    >
      <ReportSummaryGrid
        items={[
          { label: "Total expenses", value: formatCurrency(total) },
          { label: "Entries", value: String(rows.length) },
        ]}
      />

      <div className="rounded-xl border border-border bg-card p-5">
        <ReportTable
          data={rows}
          getRowKey={(row) => row.id}
          emptyMessage="No expenses in this period."
          columns={[
            { key: "date", header: "Date", cell: (row) => formatDate(row.date) },
            {
              key: "particular",
              header: "Particular",
              cell: (row) => <span className="font-medium">{row.particular}</span>,
            },
            {
              key: "amount",
              header: "Amount",
              align: "right",
              cell: (row) => formatCurrency(row.amount),
            },
            {
              key: "mode",
              header: "Mode",
              cell: (row) => <span className="capitalize">{row.paymentMode}</span>,
            },
            { key: "bank", header: "Bank", cell: (row) => row.bankName ?? "—" },
            { key: "remark", header: "Remark", cell: (row) => row.remark ?? "—" },
          ]}
        />
      </div>
    </ReportLayout>
  );
}