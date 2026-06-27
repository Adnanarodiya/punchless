import { redirectUnlessFullDashboard } from "@/lib/utils/dashboard-experience-guard";
import { ReportLayout, ReportSummaryGrid } from "@/components/report-layout";
import { ReportTable } from "@/components/report-table";
import { getYearlyReport } from "@/lib/queries/report.queries";
import { resolveReportPeriod } from "@/lib/utils/report-period";
import { CALENDAR_YEARLY_REPORT_NOTICE } from "@/lib/content/fy-calendar-copy";
import { formatCurrency } from "@/lib/utils/formatting";

export default async function YearlyReportPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  await redirectUnlessFullDashboard("/dashboard/reports");
  const params = await searchParams;
  const period = resolveReportPeriod(params, { mode: "year" });
  const year = Number(period.start.slice(0, 4));
  const report = await getYearlyReport(year);

  const exportRows: string[][] = [
    ["Month", "Income", "Expense", "Net"],
    ...report.months.map((row) => [
      row.label,
      String(row.income),
      String(row.expense),
      String(row.net),
    ]),
    [],
    ["Year total income", String(report.totalIncome)],
    ["Year total expense", String(report.totalExpense)],
    ["Year net", String(report.net)],
  ];

  return (
    <ReportLayout
      title="Yearly Report"
      description="Month-by-month income vs expense for the calendar year (January–December)."
      basePath="/dashboard/reports/yearly"
      period={period}
      periodMode="year"
      exportRows={exportRows}
      exportFilename={`yearly-report-${year}`}
      periodNotice={CALENDAR_YEARLY_REPORT_NOTICE}
    >
      <ReportSummaryGrid
        items={[
          { label: "Year income", value: formatCurrency(report.totalIncome) },
          { label: "Year expense", value: formatCurrency(report.totalExpense) },
          { label: "Year net", value: formatCurrency(report.net) },
        ]}
      />

      <div className="rounded-xl border border-border bg-card p-5">
        <ReportTable
          data={report.months}
          getRowKey={(row) => row.key}
          columns={[
            { key: "month", header: "Month", cell: (row) => row.label },
            { key: "income", header: "Income", align: "right", cell: (row) => formatCurrency(row.income) },
            { key: "expense", header: "Expense", align: "right", cell: (row) => formatCurrency(row.expense) },
            { key: "net", header: "Net", align: "right", cell: (row) => formatCurrency(row.net) },
          ]}
        />
      </div>
    </ReportLayout>
  );
}