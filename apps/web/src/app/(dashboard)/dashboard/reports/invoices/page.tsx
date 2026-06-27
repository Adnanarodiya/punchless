import { redirectUnlessFullDashboard } from "@/lib/utils/dashboard-experience-guard";
import { ReportLayout, ReportSummaryGrid } from "@/components/report-layout";
import { ReportTable } from "@/components/report-table";
import { getInvoiceReport } from "@/lib/queries/report.queries";
import { resolveReportPeriod } from "@/lib/utils/report-period";
import { formatCurrency, formatDate } from "@/lib/utils/formatting";

export default async function InvoiceReportPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; start?: string; end?: string }>;
}) {
  await redirectUnlessFullDashboard("/dashboard/reports");
  const params = await searchParams;
  const period = resolveReportPeriod(params);
  const rows = await getInvoiceReport(period.start, period.end);

  const total = rows.reduce((s, r) => s + r.totalAmount, 0);
  const totalCredit = rows.reduce((s, r) => s + r.creditAmount, 0);

  const exportRows: string[][] = [
    [
      "Invoice #",
      "Date",
      "Customer",
      "Vehicle",
      "Total",
      "Cash",
      "Bank",
      "Credit",
      "GST %",
      "GST",
    ],
    ...rows.map((row) => [
      row.invoiceNumber,
      row.invoiceDate,
      row.clientName,
      row.vehicleNumber ?? "",
      String(row.totalAmount),
      String(row.cashAmount),
      String(row.bankAmount),
      String(row.creditAmount),
      String(row.gstPercent),
      String(row.gstAmount),
    ]),
  ];

  return (
    <ReportLayout
      title="Invoice Report"
      description="Tax invoices with payment mode split for the selected period."
      basePath="/dashboard/reports/invoices"
      period={period}
      exportRows={exportRows}
      exportFilename={`invoice-report-${period.start}-to-${period.end}`}
    >
      <ReportSummaryGrid
        items={[
          { label: "Invoices", value: String(rows.length) },
          { label: "Total billed", value: formatCurrency(total) },
          { label: "On credit", value: formatCurrency(totalCredit) },
        ]}
      />

      <div className="rounded-xl border border-border bg-card p-5">
        <ReportTable
          data={rows}
          getRowKey={(row) => row.id}
          emptyMessage="No invoices in this period."
          columns={[
            {
              key: "number",
              header: "Invoice #",
              cell: (row) => <span className="font-medium">{row.invoiceNumber}</span>,
            },
            { key: "date", header: "Date", cell: (row) => formatDate(row.invoiceDate) },
            { key: "client", header: "Customer", cell: (row) => row.clientName },
            { key: "total", header: "Total", align: "right", cell: (row) => formatCurrency(row.totalAmount) },
            { key: "cash", header: "Cash", align: "right", cell: (row) => formatCurrency(row.cashAmount) },
            { key: "bank", header: "Bank", align: "right", cell: (row) => formatCurrency(row.bankAmount) },
            {
              key: "credit",
              header: "Credit",
              align: "right",
              cell: (row) =>
                row.creditAmount > 0 ? (
                  <span className="text-warning">{formatCurrency(row.creditAmount)}</span>
                ) : (
                  "—"
                ),
            },
          ]}
        />
      </div>
    </ReportLayout>
  );
}