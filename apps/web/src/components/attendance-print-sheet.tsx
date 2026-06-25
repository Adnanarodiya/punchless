"use client";

import { Printer } from "lucide-react";

import { Button } from "@punchless/ui/components/button";

import type { AttendanceWithDetails } from "@/lib/queries/attendance.queries";
import { formatDuration, formatTime, STATE_CONFIG } from "@/lib/utils/formatting";

interface Props {
  sessions: AttendanceWithDetails[];
  dateLabel: string;
}

export function AttendancePrintSheet({ sessions, dateLabel }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h2 className="text-lg font-semibold">Attendance sheet</h2>
          <p className="text-sm text-muted-foreground">
            Print-friendly view for {dateLabel}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="size-4" />
          Print sheet
        </Button>
      </div>

      <div className="attendance-print-area rounded-xl border border-border bg-card overflow-hidden print:border-0 print:shadow-none">
        <div className="hidden print:block border-b border-border px-6 py-4">
          <h1 className="text-xl font-bold">Attendance Sheet</h1>
          <p className="text-sm text-muted-foreground">{dateLabel}</p>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-4 py-2 text-left">Employee</th>
              <th className="px-4 py-2 text-left">State</th>
              <th className="px-4 py-2 text-left">Workshop / Job</th>
              <th className="px-4 py-2 text-left">Start</th>
              <th className="px-4 py-2 text-left">End</th>
              <th className="px-4 py-2 text-right">Duration</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No sessions to print
                </td>
              </tr>
            ) : (
              sessions.map((session) => {
                const state = STATE_CONFIG[session.state] ?? {
                  label: session.state,
                };
                const location =
                  session.job_title ?? session.workshop_name ?? "—";
                const duration =
                  session.duration_minutes != null
                    ? formatDuration(session.duration_minutes)
                    : session.end_time
                      ? "—"
                      : "Active";

                return (
                  <tr key={session.id} className="border-b border-border">
                    <td className="px-4 py-2 font-medium">
                      {session.employee_name}
                    </td>
                    <td className="px-4 py-2 capitalize">{state.label}</td>
                    <td className="px-4 py-2">{location}</td>
                    <td className="px-4 py-2">
                      {formatTime(session.start_time)}
                    </td>
                    <td className="px-4 py-2">
                      {session.end_time
                        ? formatTime(session.end_time)
                        : "—"}
                    </td>
                    <td className="px-4 py-2 text-right">{duration}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}