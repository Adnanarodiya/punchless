import { Suspense } from "react";

import { getJobs } from "@/lib/queries/job.queries";
import { getEmployees } from "@/lib/queries/employee.queries";
import { DashboardPageHeader } from "@/components/dashboard-page-header";
import { JobManager } from "./job-manager";

export default async function JobsPage() {
  const [jobs, employees] = await Promise.all([
    getJobs(),
    getEmployees(),
  ]);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Jobs"
        description="On-site customer jobs — assign staff, set GPS location, and track status from pending to completed."
      />
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading jobs…</div>}>
        <JobManager jobs={jobs} employees={employees} />
      </Suspense>
    </div>
  );
}