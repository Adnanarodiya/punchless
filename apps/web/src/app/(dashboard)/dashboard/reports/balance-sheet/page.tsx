import { redirectUnlessFullDashboard } from "@/lib/utils/dashboard-experience-guard";
import { ReportLayout, ReportSummaryGrid } from "@/components/report-layout";
import { ReportTable } from "@/components/report-table";
import { getBalanceSheetReport } from "@/lib/queries/report.queries";
import { resolveReportPeriod } from "@/lib/utils/report-period";
import { formatCurrency } from "@/lib/utils/formatting";

export default async function BalanceSheetReportPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; start?: string; end?: string }>;
}) {
  await redirectUnlessFullDashboard("/dashboard/reports");
  const params = await searchParams;
  const period = resolveReportPeriod(params);
  const report = await getBalanceSheetReport(period.start, period.end);

  const assetRows = report.rows.filter((row) => row.section === "asset");
  const liabilityRows = report.rows.filter((row) => row.section === "liability");

  const exportRows: string[][] = [
    ["Balance Sheet", `${period.start} to ${period.end}`],
    [],
    ["Section", "Item", "Opening", "Closing"],
    ...report.rows.map((row) => [
      row.section === "asset" ? "Asset" : "Liability",
      row.label,
      String(row.opening),
      String(row.closing),
    ]),
    [],
    ["Total assets", "", String(report.openingAssets), String(report.closingAssets)],
    [
      "Total liabilities",
      "",
      String(report.openingLiabilities),
      String(report.closingLiabilities),
    ],
    ["Net worth", "", String(report.openingNetWorth), String(report.closingNetWorth)],
    [],
    ["Bank", "Opening", "Closing"],
    ...report.banks.map((bank) => [
      bank.bankName,
      String(bank.opening),
      String(bank.closing),
    ]),
  ];

  return (
    <ReportLayout
      title="Balance Sheet"
      description="Assets and liabilities snapshot — opening balance (before the period) vs closing balance (end of period)."
      basePath="/dashboard/reports/balance-sheet"
      period={period}
      exportRows={exportRows}
      exportFilename={`balance-sheet-${period.start}-to-${period.end}`}
    >
      <ReportSummaryGrid
        items={[
          {
            label: "Closing assets",
            value: formatCurrency(report.closingAssets),
            hint: `Opening ${formatCurrency(report.openingAssets)}`,
          },
          {
            label: "Closing liabilities",
            value: formatCurrency(report.closingLiabilities),
            hint: `Opening ${formatCurrency(report.openingLiabilities)}`,
          },
          {
            label: "Closing net worth",
            value: formatCurrency(report.closingNetWorth),
            hint: `Opening ${formatCurrency(report.openingNetWorth)}`,
          },
          {
            label: "Period change",
            value: formatCurrency(report.closingNetWorth - report.openingNetWorth),
            hint: "Net worth movement in period",
          },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-lg font-semibold">Assets</h2>
          <ReportTable
            data={assetRows}
            getRowKey={(row) => row.id}
            emptyMessage="No asset balances."
            columns={[
              { key: "label", header: "Item", cell: (row) => row.label },
              {
                key: "opening",
                header: "Opening",
                align: "right",
                cell: (row) => formatCurrency(row.opening),
              },
              {
                key: "closing",
                header: "Closing",
                align: "right",
                cell: (row) => (
                  <span className="font-medium">{formatCurrency(row.closing)}</span>
                ),
              },
            ]}
          />
          <div className="mt-4 flex justify-between border-t border-border pt-3 text-sm font-semibold">
            <span>Total assets</span>
            <div className="flex gap-8 text-right">
              <span>{formatCurrency(report.openingAssets)}</span>
              <span>{formatCurrency(report.closingAssets)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-lg font-semibold">Liabilities</h2>
          <ReportTable
            data={liabilityRows}
            getRowKey={(row) => row.id}
            emptyMessage="No liability balances."
            columns={[
              { key: "label", header: "Item", cell: (row) => row.label },
              {
                key: "opening",
                header: "Opening",
                align: "right",
                cell: (row) => formatCurrency(row.opening),
              },
              {
                key: "closing",
                header: "Closing",
                align: "right",
                cell: (row) => (
                  <span className="font-medium">{formatCurrency(row.closing)}</span>
                ),
              },
            ]}
          />
          <div className="mt-4 flex justify-between border-t border-border pt-3 text-sm font-semibold">
            <span>Total liabilities</span>
            <div className="flex gap-8 text-right">
              <span>{formatCurrency(report.openingLiabilities)}</span>
              <span>{formatCurrency(report.closingLiabilities)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">Net worth</h2>
          <p className="text-sm text-muted-foreground">Assets minus liabilities</p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:max-w-md">
          <div>
            <p className="text-sm text-muted-foreground">Opening</p>
            <p className="text-xl font-bold">{formatCurrency(report.openingNetWorth)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Closing</p>
            <p className="text-xl font-bold">{formatCurrency(report.closingNetWorth)}</p>
          </div>
        </div>
      </div>

      {report.banks.length > 0 ? (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-lg font-semibold">Bank accounts</h2>
          <ReportTable
            data={report.banks}
            getRowKey={(row) => row.id}
            columns={[
              { key: "bank", header: "Bank", cell: (row) => row.bankName },
              {
                key: "opening",
                header: "Opening",
                align: "right",
                cell: (row) => formatCurrency(row.opening),
              },
              {
                key: "closing",
                header: "Closing",
                align: "right",
                cell: (row) => formatCurrency(row.closing),
              },
            ]}
          />
        </div>
      ) : null}
    </ReportLayout>
  );
}