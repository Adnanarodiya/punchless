import { ReportLayout, ReportSummaryGrid } from "@/components/report-layout";
import { ReportTable } from "@/components/report-table";
import { getDailyReport } from "@/lib/queries/report.queries";
import { resolveReportPeriod } from "@/lib/utils/report-period";
import { formatCurrency, formatDate } from "@/lib/utils/formatting";

export default async function DailyReportPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; start?: string; end?: string }>;
}) {
  const params = await searchParams;
  const period = resolveReportPeriod(params);
  const report = await getDailyReport(period.start, period.end);

  const exportRows: string[][] = [
    ["Date", "Income", "Expense", "Net"],
    ...report.breakdown.map((row) => [
      row.date,
      String(row.income),
      String(row.expense),
      String(row.net),
    ]),
  ];

  return (
    <ReportLayout
      title="Daily Summary"
      description="Business activity and cash-flow totals for the selected period."
      basePath="/dashboard/reports/daily"
      period={period}
      exportRows={exportRows}
      exportFilename={`daily-report-${period.start}-to-${period.end}`}
    >
      <ReportSummaryGrid
        items={[
          { label: "Income", value: formatCurrency(report.totalIncome) },
          { label: "Expense", value: formatCurrency(report.totalExpense) },
          { label: "Net (Income − Expense)", value: formatCurrency(report.net) },
          { label: "Invoices billed", value: formatCurrency(report.invoiceTotal) },
          { label: "Supplier bills", value: formatCurrency(report.purchaseTotal) },
          { label: "Customer payments in", value: formatCurrency(report.clientPayments) },
          { label: "Supplier payments out", value: formatCurrency(report.supplierPayments) },
          { label: "Staff paid out", value: formatCurrency(report.staffPayments) },
        ]}
      />

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-lg font-semibold">Day-wise breakdown</h2>
        <ReportTable
          data={report.breakdown}
          getRowKey={(row) => row.date}
          emptyMessage="No transactions in this period."
          columns={[
            { key: "date", header: "Date", cell: (row) => formatDate(row.date) },
            { key: "income", header: "Income", align: "right", cell: (row) => formatCurrency(row.income) },
            { key: "expense", header: "Expense", align: "right", cell: (row) => formatCurrency(row.expense) },
            {
              key: "net",
              header: "Net",
              align: "right",
              cell: (row) => (
                <span className={row.net < 0 ? "text-destructive" : "text-success"}>
                  {formatCurrency(row.net)}
                </span>
              ),
            },
          ]}
        />
      </div>
    </ReportLayout>
  );
}