import { getDailyBookReport } from "@/lib/queries/daily-book.queries";
import { getCompanySettings } from "@/lib/queries/settings.queries";

import { DailyReportManager } from "./daily-report-manager";

export default async function DailyReportPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const bookDate =
    params.date?.trim() || new Date().toISOString().slice(0, 10);

  const [report, settings] = await Promise.all([
    getDailyBookReport(bookDate),
    getCompanySettings(),
  ]);

  const isFullExperience = settings?.dashboard_experience === "full";

  return (
    <DailyReportManager
      mode="day"
      report={report}
      showFullReportLink={isFullExperience}
    />
  );
}