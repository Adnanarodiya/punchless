import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/queries/auth.queries";
import { getAuditLogs } from "@/lib/queries/audit.queries";
import { resolveReportPeriod } from "@/lib/utils/report-period";

import { AuditLogManager } from "./audit-log-manager";

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; start?: string; end?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "owner") {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const period = resolveReportPeriod(params);
  const logs = await getAuditLogs({
    startDate: period.start,
    endDate: period.end,
  });

  return (
    <AuditLogManager
      logs={logs}
      period={period}
    />
  );
}