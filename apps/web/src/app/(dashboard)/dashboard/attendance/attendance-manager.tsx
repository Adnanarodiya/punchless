"use client";

import { useState } from "react";
import { Button } from "@punchless/ui/components/button";
import { Plus, X, StopCircle, Trash2, Radio, History } from "lucide-react";
import {
  createAttendanceSession,
  closeAttendanceSession,
  deleteAttendanceSession,
} from "@/lib/actions/attendance.actions";
import type { AttendanceWithDetails } from "@/lib/queries/attendance.queries";
import type { EmployeeWithWorkshop } from "@/lib/queries/employee.queries";
import type { Database } from "@punchless/types/database.types";
import { formatDuration, formatTime, getLiveDurationMinutes, STATE_CONFIG } from "@/lib/utils/formatting";

type WorkshopRow = Database["public"]["Tables"]["workshops"]["Row"];

interface Props {
  todaySessions: AttendanceWithDetails[];
  activeSessions: AttendanceWithDetails[];
  employees: EmployeeWithWorkshop[];
  workshops: WorkshopRow[];
}

export function AttendanceManager({ todaySessions, activeSessions, employees, workshops }: Props) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [tab, setTab] = useState<"live" | "today">("live");
  const [showEndTime, setShowEndTime] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(formData: FormData) {
    try {
      setError(null);
      await createAttendanceSession(formData);
      setShowAddForm(false);
      setShowEndTime(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create session");
    }
  }

  const inputClass = "w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm";
  const selectClass = "w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm";

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active Now" value={activeSessions.length} colorClass="text-success" />
        <StatCard
          label="Workshop"
          value={activeSessions.filter((s) => s.state === "workshop").length}
          colorClass="text-state-workshop"
        />
        <StatCard
          label="Traveling"
          value={activeSessions.filter((s) => s.state === "travel").length}
          colorClass="text-state-travel"
        />
        <StatCard
          label="On-Site"
          value={activeSessions.filter((s) => s.state === "on_site_job").length}
          colorClass="text-state-onsite"
        />
      </div>

      {/* Tabs + Add button */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => setTab("live")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === "live" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            <Radio className="size-4 inline mr-1.5" />
            Live ({activeSessions.length})
          </button>
          <button
            onClick={() => setTab("today")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === "today" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            <History className="size-4 inline mr-1.5" />
            Today ({todaySessions.length})
          </button>
        </div>

        <Button onClick={() => setShowAddForm(!showAddForm)} variant={showAddForm ? "outline" : "default"} size="sm">
          {showAddForm ? <X className="size-4" /> : <Plus className="size-4" />}
          {showAddForm ? "Cancel" : "Add Session"}
        </Button>
      </div>

      {/* Add session form */}
      {showAddForm && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-3">Add Manual Session</h3>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <p>{error}</p>
            </div>
          )}

          <form action={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Employee</label>
              <select name="employeeId" required className={selectClass}>
                <option value="">Select employee...</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">State</label>
              <select name="state" required className={selectClass}>
                <option value="workshop">Workshop</option>
                <option value="travel">Travel</option>
                <option value="on_site_job">On-Site Job</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">Workshop</label>
              <select name="workshopId" className={selectClass}>
                <option value="">None</option>
                {workshops.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">Start Time</label>
              <input name="startTime" type="datetime-local" required className={inputClass} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-muted-foreground">End Time</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    id="showEndTime"
                    checked={showEndTime}
                    onChange={(e) => setShowEndTime(e.target.checked)}
                    className="size-3 rounded border-input bg-background"
                  />
                  <label htmlFor="showEndTime" className="text-[10px] text-muted-foreground cursor-pointer select-none">
                    Set End Time?
                  </label>
                </div>
              </div>
              {showEndTime ? (
                <input name="endTime" type="datetime-local" required className={inputClass} />
              ) : (
                <div className="h-10 px-3 rounded-lg border border-border bg-muted/50 text-muted-foreground text-sm flex items-center select-none">
                  <span className="text-success text-xs font-medium animate-pulse">● Live Session (Auto)</span>
                </div>
              )}
            </div>

            <div className="flex items-end">
              <Button type="submit" className="w-full">
                Create Session
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Sessions list */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {tab === "live" ? (
          <SessionTable
            sessions={activeSessions}
            showLiveDuration
            emptyMessage="No active sessions right now"
          />
        ) : (
          <SessionTable
            sessions={todaySessions}
            showLiveDuration={false}
            emptyMessage="No attendance sessions today"
          />
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, colorClass }: { label: string; value: number; colorClass: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
    </div>
  );
}

function SessionTable({
  sessions,
  showLiveDuration,
  emptyMessage,
}: {
  sessions: AttendanceWithDetails[];
  showLiveDuration: boolean;
  emptyMessage: string;
}) {
  if (sessions.length === 0) {
    return <p className="text-sm text-muted-foreground p-6 text-center">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="p-3 font-medium">Employee</th>
            <th className="p-3 font-medium">State</th>
            <th className="p-3 font-medium">Workshop</th>
            <th className="p-3 font-medium">Start</th>
            <th className="p-3 font-medium">End</th>
            <th className="p-3 font-medium">Duration</th>
            <th className="p-3 font-medium w-24">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => {
            const config = STATE_CONFIG[s.state] ?? STATE_CONFIG.off_duty;
            const isOpen = !s.end_time;
            const duration = isOpen && showLiveDuration
              ? getLiveDurationMinutes(s.start_time)
              : s.duration_minutes;

            return (
              <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                <td className="p-3">
                  <p className="font-medium">{s.employee_name}</p>
                  <p className="text-xs text-muted-foreground">{s.employee_email}</p>
                </td>
                <td className="p-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.colorClass} ${config.bgClass}`}>
                    <span className={`size-1.5 rounded-full ${isOpen ? "animate-pulse" : ""} bg-current`} />
                    {config.label}
                  </span>
                </td>
                <td className="p-3 text-muted-foreground">
                  {s.workshop_name || s.job_title || "—"}
                </td>
                <td className="p-3">{formatTime(s.start_time)}</td>
                <td className="p-3">
                  {isOpen ? (
                    <span className="text-xs text-success font-medium animate-pulse">● Live</span>
                  ) : (
                    formatTime(s.end_time)
                  )}
                </td>
                <td className="p-3 font-mono">
                  {isOpen && showLiveDuration ? (
                    <span className="text-success">{formatDuration(duration)}</span>
                  ) : (
                    formatDuration(duration)
                  )}
                </td>
                <td className="p-3">
                  <div className="flex gap-1">
                    {isOpen && (
                      <form action={closeAttendanceSession}>
                        <input type="hidden" name="sessionId" value={s.id} />
                        <Button variant="ghost" size="icon" type="submit" title="Close session">
                          <StopCircle className="size-4 text-warning" />
                        </Button>
                      </form>
                    )}
                    <form action={deleteAttendanceSession}>
                      <input type="hidden" name="sessionId" value={s.id} />
                      <Button variant="ghost" size="icon" type="submit" title="Delete session">
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </form>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
