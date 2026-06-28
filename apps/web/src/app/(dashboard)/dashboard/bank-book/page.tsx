import { getBankBookReportForRange } from "@/lib/queries/cash-book.queries";
import { getDataLockStatus } from "@/lib/queries/settings.queries";
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

export default async function BankBookPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; start?: string; end?: string }>;
}) {
  const params = await searchParams;
  const { start, end } = resolveBookRange(params);

  const [report, dataLock] = await Promise.all([
    getBankBookReportForRange(start, end),
    getDataLockStatus(),
  ]);

  return (
    <BookReportManager
      title="Bank book"
      description="Bank receipts and payments (UPI and net banking) — same layout as daily report."
      breadcrumbLabel="Bank book"
      basePath="/dashboard/bank-book"
      report={report}
      hasDataLockPin={dataLock.hasPin}
    />
  );
}