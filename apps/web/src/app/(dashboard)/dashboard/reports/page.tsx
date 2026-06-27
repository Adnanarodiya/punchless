import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { InfoHint } from "@/components/info-hint";
import { filterReportsForExperience } from "@/lib/content/reports-nav";
import { getCompanySettings } from "@/lib/queries/settings.queries";

export default async function ReportsIndexPage() {
  const settings = await getCompanySettings();
  const experience = settings?.dashboard_experience === "full" ? "full" : "simple";
  const reports = filterReportsForExperience(experience);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Financial reports — pick a period, print, or export CSV and Excel."
      />

      {experience === "simple" ? (
        <InfoHint title="Simple mode">
          Daily and monthly reports cover most day-to-day checks. Switch to <strong>Full dashboard</strong> in
          Settings for GST, yearly, Rojmel, and other advanced reports.
        </InfoHint>
      ) : (
        <InfoHint title="Quick glossary">
          <strong>Rojmel</strong> = traditional daily cash book (every debit/credit with running balance).{" "}
          <strong>Income &amp; Expense</strong> (Transactions page) = manual business P&amp;L entries — different from{" "}
          <strong>Bank balance</strong> (Banks page). <strong>Yearly report</strong> uses calendar year (Jan–Dec); the
          dashboard overview uses Indian FY (Apr–Mar).
        </InfoHint>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Link
              key={report.href}
              href={report.href}
              className="rounded-xl border border-border bg-card p-5 transition hover:border-primary/30 hover:bg-accent/30"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{report.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {report.description}
                  </p>
                </div>
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Icon className="size-5" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}