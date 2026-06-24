"use client";

import Link from "next/link";

import { DataTable } from "@punchless/ui/components/data-table";
import { cn } from "@punchless/ui/lib/utils";

import type { AttendanceWithDetails } from "@/lib/queries/attendance.queries";
import type { JobWithDetails } from "@/lib/queries/job.queries";
import {
  formatTime,
  formatDuration,
  getLiveDurationMinutes,
  STATE_CONFIG,
} from "@/lib/utils/formatting";

interface DashboardRecentTablesProps {
  recentAttendance: AttendanceWithDetails[];
  recentJobs: JobWithDetails[];
}

const JOB_STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  pending: { label: "Pending", className: "bg-muted text-muted-foreground" },
  assigned: { label: "Assigned", className: "bg-state-travel/10 text-state-travel" },
  in_progress: {
    label: "In Progress",
    className: "bg-warning/10 text-warning",
  },
  completed: { label: "Completed", className: "bg-success/10 text-success" },
  cancelled: {
    label: "Cancelled",
    className: "bg-destructive/10 text-destructive",
  },
};

function AttendanceStateBadge({ state }: { state: string }) {
  const config = STATE_CONFIG[state] ?? STATE_CONFIG.off_duty;
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        config.bgClass,
        config.colorClass
      )}
    >
      {config.label}
    </span>
  );
}

function JobStatusBadge({ status }: { status: string | null }) {
  const config =
    JOB_STATUS_CONFIG[status ?? "pending"] ?? JOB_STATUS_CONFIG.pending;
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}

export function DashboardRecentTables({
  recentAttendance,
  recentJobs,
}: DashboardRecentTablesProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section
        className="rounded-xl border border-border bg-card p-5"
        aria-labelledby="recent-attendance-heading"
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 id="recent-attendance-heading" className="text-lg font-semibold">
            Recent Attendance
          </h2>
          <Link
            href="/dashboard/attendance"
            className="text-sm text-primary hover:underline"
          >
            View all
          </Link>
        </div>
        <DataTable
          data={recentAttendance}
          getRowKey={(row) => row.id}
          emptyMessage="No attendance sessions in the last 7 days."
          columns={[
            {
              key: "employee",
              header: "Employee",
              cell: (row) => (
                <span className="font-medium">{row.employee_name}</span>
              ),
            },
            {
              key: "state",
              header: "State",
              cell: (row) => <AttendanceStateBadge state={row.state} />,
            },
            {
              key: "time",
              header: "Time",
              cell: (row) => (
                <span className="text-muted-foreground">
                  {formatTime(row.start_time)}
                  {row.end_time ? ` – ${formatTime(row.end_time)}` : " – Live"}
                </span>
              ),
            },
            {
              key: "duration",
              header: "Duration",
              cell: (row) =>
                row.end_time
                  ? formatDuration(row.duration_minutes)
                  : formatDuration(getLiveDurationMinutes(row.start_time)),
            },
          ]}
        />
      </section>

      <section
        className="rounded-xl border border-border bg-card p-5"
        aria-labelledby="recent-jobs-heading"
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 id="recent-jobs-heading" className="text-lg font-semibold">
            Recent Jobs
          </h2>
          <Link
            href="/dashboard/jobs"
            className="text-sm text-primary hover:underline"
          >
            View all
          </Link>
        </div>
        <DataTable
          data={recentJobs}
          getRowKey={(row) => row.id}
          emptyMessage="No jobs created yet."
          columns={[
            {
              key: "title",
              header: "Job",
              cell: (row) => (
                <div>
                  <p className="font-medium">{row.title}</p>
                  {row.customer_name ? (
                    <p className="text-xs text-muted-foreground">
                      {row.customer_name}
                    </p>
                  ) : null}
                </div>
              ),
            },
            {
              key: "assigned",
              header: "Assigned",
              cell: (row) => (
                <span className="text-muted-foreground">
                  {row.assigned_to_name ?? "Unassigned"}
                </span>
              ),
            },
            {
              key: "status",
              header: "Status",
              cell: (row) => <JobStatusBadge status={row.status} />,
            },
          ]}
        />
      </section>
    </div>
  );
}