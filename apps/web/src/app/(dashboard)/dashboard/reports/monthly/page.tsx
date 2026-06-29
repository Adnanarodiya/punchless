import { DailyReportManager } from "@/app/(dashboard)/dashboard/daily-report/daily-report-manager";
import { getMonthlyBookReport } from "@/lib/queries/daily-book.queries";
import { getCompanySettings } from "@/lib/queries/settings.queries";
import { resolveReportPeriod } from "@/lib/utils/report-period";

export default async function MonthlyReportPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const period = resolveReportPeriod(params, { mode: "month" });

  const [report, settings] = await Promise.all([
    getMonthlyBookReport(period.start, period.end),
    getCompanySettings(),
  ]);

  const isFullExperience = settings?.dashboard_experience === "full";

  return (
    <DailyReportManager
      mode="month"
      report={report}
      showFullReportLink={isFullExperience}
    />
  );
}