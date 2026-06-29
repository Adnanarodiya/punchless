import { getCashBookReportForRange } from "@/lib/queries/cash-book.queries";
import { BookReportManager } from "@/components/book-report-manager";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function resolveBookRange(params: { date?: string; start?: string; end?: string }) {
  const today = todayIso();
  const start = params.start?.trim() || params.date?.trim() || today;
  const end = params.end?.trim() || params.date?.trim() || start;
  return end < start ? { start: end, end: start } : { start, end };
}

export default async function CashBookPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; start?: string; end?: string }>;
}) {
  const params = await searchParams;
  const { start, end } = resolveBookRange(params);
  const report = await getCashBookReportForRange(start, end);

  return (
    <BookReportManager
      title="Cash book"
      description="All cash receipts and payments — same layout as daily report."
      breadcrumbLabel="Cash book"
      basePath="/dashboard/cash-book"
      report={report}
    />
  );
}