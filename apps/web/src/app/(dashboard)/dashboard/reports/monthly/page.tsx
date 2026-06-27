import { ReportLayout, ReportSummaryGrid } from "@/components/report-layout";
import { ReportTable } from "@/components/report-table";
import { getMonthlyReport } from "@/lib/queries/report.queries";
import { resolveReportPeriod } from "@/lib/utils/report-period";
import { CALENDAR_MONTHLY_REPORT_NOTICE } from "@/lib/content/fy-calendar-copy";
import { formatCurrency, formatDate } from "@/lib/utils/formatting";

export default async function MonthlyReportPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const period = resolveReportPeriod(params, { mode: "month" });
  const report = await getMonthlyReport(period.start, period.end);

  const exportRows: string[][] = [
    ["Metric", "Amount"],
    ["Income", String(report.totalIncome)],
    ["Expense", String(report.totalExpense)],
    ["Net", String(report.net)],
    ["Invoices", String(report.invoiceTotal)],
    ["Supplier bills", String(report.purchaseTotal)],
    ["Customer payments", String(report.clientPayments)],
    ["Supplier payments", String(report.supplierPayments)],
    ["Staff payments", String(report.staffPayments)],
    [],
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
      title="Monthly Report"
      description="Month P&L and daily breakdown within the selected month."
      basePath="/dashboard/reports/monthly"
      period={period}
      periodMode="month"
      exportRows={exportRows}
      exportFilename={`monthly-report-${period.start.slice(0, 7)}`}
      periodNotice={CALENDAR_MONTHLY_REPORT_NOTICE}
    >
      <ReportSummaryGrid
        items={[
          { label: "Income", value: formatCurrency(report.totalIncome) },
          { label: "Expense", value: formatCurrency(report.totalExpense) },
          { label: "Net", value: formatCurrency(report.net) },
          { label: "Invoices", value: formatCurrency(report.invoiceTotal) },
        ]}
      />

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-lg font-semibold">Daily activity</h2>
        <ReportTable
          data={report.breakdown}
          getRowKey={(row) => row.date}
          emptyMessage="No activity this month."
          columns={[
            { key: "date", header: "Date", cell: (row) => formatDate(row.date) },
            { key: "income", header: "Income", align: "right", cell: (row) => formatCurrency(row.income) },
            { key: "expense", header: "Expense", align: "right", cell: (row) => formatCurrency(row.expense) },
            { key: "net", header: "Net", align: "right", cell: (row) => formatCurrency(row.net) },
          ]}
        />
      </div>
    </ReportLayout>
  );
}