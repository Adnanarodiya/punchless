import { Suspense } from "react";

import { getJobs } from "@/lib/queries/job.queries";
import { getEmployees } from "@/lib/queries/employee.queries";
import { JobManager } from "./job-manager";

export default async function JobsPage() {
  const [jobs, employees] = await Promise.all([
    getJobs(),
    getEmployees(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Jobs</h1>
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading jobs…</div>}>
        <JobManager jobs={jobs} employees={employees} />
      </Suspense>
    </div>
  );
}
