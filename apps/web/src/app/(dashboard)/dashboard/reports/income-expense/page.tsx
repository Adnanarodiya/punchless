import { ReportLayout, ReportSummaryGrid } from "@/components/report-layout";
import { ReportTable } from "@/components/report-table";
import { getIncomeExpenseReport } from "@/lib/queries/report.queries";
import { resolveReportPeriod } from "@/lib/utils/report-period";
import { formatCurrency } from "@/lib/utils/formatting";

export default async function IncomeExpenseReportPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; start?: string; end?: string }>;
}) {
  const params = await searchParams;
  const period = resolveReportPeriod(params);
  const rows = await getIncomeExpenseReport(period.start, period.end);

  const totalIncome = rows.reduce((s, r) => s + r.income, 0);
  const totalExpense = rows.reduce((s, r) => s + r.expense, 0);

  const exportRows: string[][] = [
    ["Particular", "Income", "Expense", "Net", "Entries"],
    ...rows.map((row) => [
      row.particular,
      String(row.income),
      String(row.expense),
      String(row.net),
      String(row.count),
    ]),
  ];

  return (
    <ReportLayout
      title="Income / Expense Report"
      description="Particular-wise breakdown from Income & Expense transactions."
      basePath="/dashboard/reports/income-expense"
      period={period}
      exportRows={exportRows}
      exportFilename={`income-expense-${period.start}-to-${period.end}`}
    >
      <ReportSummaryGrid
        items={[
          { label: "Total income", value: formatCurrency(totalIncome) },
          { label: "Total expense", value: formatCurrency(totalExpense) },
          { label: "Net", value: formatCurrency(totalIncome - totalExpense) },
        ]}
      />

      <div className="rounded-xl border border-border bg-card p-5">
        <ReportTable
          data={rows}
          getRowKey={(row) => row.particular}
          columns={[
            {
              key: "particular",
              header: "Particular",
              cell: (row) => <span className="font-medium">{row.particular}</span>,
            },
            {
              key: "income",
              header: "Income",
              align: "right",
              cell: (row) => formatCurrency(row.income),
            },
            {
              key: "expense",
              header: "Expense",
              align: "right",
              cell: (row) => formatCurrency(row.expense),
            },
            {
              key: "net",
              header: "Net",
              align: "right",
              cell: (row) => formatCurrency(row.net),
            },
            {
              key: "count",
              header: "Entries",
              align: "right",
              cell: (row) => row.count,
            },
          ]}
        />
      </div>
    </ReportLayout>
  );
}