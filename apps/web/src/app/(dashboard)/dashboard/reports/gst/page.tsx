import { redirectUnlessFullDashboard } from "@/lib/utils/dashboard-experience-guard";
import { ReportLayout, ReportSummaryGrid } from "@/components/report-layout";
import { ReportTable } from "@/components/report-table";
import { getGstReport } from "@/lib/queries/report.queries";
import { resolveReportPeriod } from "@/lib/utils/report-period";
import { formatCurrency } from "@/lib/utils/formatting";

export default async function GstReportPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  await redirectUnlessFullDashboard("/dashboard/reports");
  const params = await searchParams;
  const period = resolveReportPeriod(params, { mode: "month" });
  const report = await getGstReport(period.start, period.end);

  const exportRows: string[][] = [
    ["GST %", "Taxable", "GST amount", "Total", "Invoices"],
    ...report.slabs.map((row) => [
      String(row.gstPercent),
      String(row.taxableAmount),
      String(row.gstAmount),
      String(row.totalAmount),
      String(row.invoiceCount),
    ]),
  ];

  return (
    <ReportLayout
      title="GST Report"
      description="Output GST from tax invoices, grouped by GST slab."
      basePath="/dashboard/reports/gst"
      period={period}
      periodMode="month"
      exportRows={exportRows}
      exportFilename={`gst-report-${period.start.slice(0, 7)}`}
    >
      <ReportSummaryGrid
        items={[
          { label: "Taxable amount", value: formatCurrency(report.totalTaxable) },
          { label: "Total GST", value: formatCurrency(report.totalGst) },
          { label: "Invoice total", value: formatCurrency(report.totalAmount) },
        ]}
      />

      <div className="rounded-xl border border-border bg-card p-5">
        <ReportTable
          data={report.slabs}
          getRowKey={(row) => String(row.gstPercent)}
          emptyMessage="No invoices in this period."
          columns={[
            { key: "gst", header: "GST %", cell: (row) => `${row.gstPercent}%` },
            { key: "taxable", header: "Taxable", align: "right", cell: (row) => formatCurrency(row.taxableAmount) },
            { key: "gstAmount", header: "GST", align: "right", cell: (row) => formatCurrency(row.gstAmount) },
            { key: "total", header: "Total", align: "right", cell: (row) => formatCurrency(row.totalAmount) },
            { key: "count", header: "Invoices", align: "right", cell: (row) => String(row.invoiceCount) },
          ]}
        />
      </div>
    </ReportLayout>
  );
}