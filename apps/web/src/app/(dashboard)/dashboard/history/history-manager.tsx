"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@punchless/ui/components/button";
import {
  Clock,
  Calendar,
  User,
  ArrowLeft,
  Users,
  MapPin,
  Briefcase,
  ChevronRight,
  List,
} from "lucide-react";
import type { HistorySession, EmployeeHistorySummary } from "@/lib/queries/history.queries";
import type { EmployeeWithWorkshop } from "@/lib/queries/employee.queries";
import {
  formatDuration,
  formatTime,
  formatDate,
  getLiveDurationMinutes,
  STATE_CONFIG,
} from "@/lib/utils/formatting";

/** Labels for current activity */
const ACTIVITY_LABEL: Record<string, string> = {
  workshop: "🏭 Working",
  travel: "🚗 Traveling",
  on_site_job: "📍 On-Site",
};

type FilterPeriod = "1day" | "7days" | "month";
type ViewTab = "employees" | "sessions";

interface Props {
  initialSessions: HistorySession[];
  initialSummaries: EmployeeHistorySummary[];
  employees: EmployeeWithWorkshop[];
}

function getDateRange(period: FilterPeriod): { start: string; end: string } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (period === "7days") {
    start.setDate(start.getDate() - 6);
  } else if (period === "month") {
    start.setDate(1);
  }

  return { start: start.toISOString(), end: end.toISOString() };
}

const periodLabel: Record<FilterPeriod, string> = {
  "1day": "Today",
  "7days": "Last 7 Days",
  month: "This Month",
};

export function HistoryManager({ initialSessions, initialSummaries, employees }: Props) {
  const [period, setPeriod] = useState<FilterPeriod>("1day");
  const [tab, setTab] = useState<ViewTab>("employees");
  const [sessions, setSessions] = useState(initialSessions);
  const [summaries, setSummaries] = useState(initialSummaries);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);
  const [page, setPage] = useState(1);

  // Tick every 30 seconds for real-time duration updates
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = useCallback(async (filterPeriod: FilterPeriod, empId?: string | null, pageNum = 1) => {
    setLoading(true);
    setPage(pageNum);
    try {
      const { start, end } = getDateRange(filterPeriod);
      const url = new URL("/api/history", window.location.origin);
      url.searchParams.set("start", start);
      url.searchParams.set("end", end);
      url.searchParams.set("page", String(pageNum));
      url.searchParams.set("limit", "50");
      if (empId) url.searchParams.set("employeeId", empId);

      const res = await fetch(url.toString());
      const data = await res.json();

      if (empId) {
        setSessions(data.sessions ?? []);
      } else {
        setSessions(data.sessions ?? []);
        setSummaries(data.summaries ?? []);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
    setLoading(false);
  }, []);

  function handlePeriodChange(newPeriod: FilterPeriod) {
    setPeriod(newPeriod);
    if (selectedEmployee) {
      fetchData(newPeriod, selectedEmployee, 1);
    } else {
      fetchData(newPeriod, null, 1);
    }
  }

  function handleTabChange(newTab: ViewTab) {
    setTab(newTab);
    // If switching back to main tabs from employee detail, reset
    if (selectedEmployee) {
      setSelectedEmployee(null);
      fetchData(period, null, 1);
    } else {
      fetchData(period, null, 1);
    }
  }

  function handleViewEmployee(empId: string) {
    setSelectedEmployee(empId);
    fetchData(period, empId, 1);
  }

  function handleBackToList() {
    setSelectedEmployee(null);
    fetchData(period, null, 1);
  }

  const selectedEmpInfo = selectedEmployee
    ? employees.find((e) => e.id === selectedEmployee)
    : null;

  return (
    <div className="space-y-6">
      {/* Top Bar: Left = Tabs, Right = Period Filter */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Left: View Tabs or Employee Detail Header */}
        <div className="flex items-center gap-2">
          {selectedEmployee ? (
            <>
              <Button variant="ghost" size="sm" onClick={handleBackToList}>
                <ArrowLeft className="size-4" />
                Back
              </Button>
              {selectedEmpInfo && (
                <div className="flex items-center gap-2 ml-1">
                  <User className="size-4 text-primary" />
                  <span className="font-semibold">{selectedEmpInfo.full_name}</span>
                  <span className="text-sm text-muted-foreground hidden sm:inline">{selectedEmpInfo.email}</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              <button
                onClick={() => handleTabChange("employees")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  tab === "employees"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Users className="size-4" />
                Employee Summary
              </button>
              <button
                onClick={() => handleTabChange("sessions")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  tab === "sessions"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <List className="size-4" />
                All Sessions
              </button>
            </div>
          )}
        </div>

        {/* Right: Period Filter */}
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {(["1day", "7days", "month"] as FilterPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                period === p
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {periodLabel[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      )}

      {/* Main Content */}
      {!loading && !selectedEmployee && tab === "employees" && (
        <EmployeeSummaryTable
          summaries={summaries}
          onViewEmployee={handleViewEmployee}
          period={period}
        />
      )}

      {!loading && !selectedEmployee && tab === "sessions" && (
        <>
          <SessionsTable sessions={sessions} />
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchData(period, null, page - 1)}
              disabled={page === 1}
            >
              ← Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchData(period, null, page + 1)}
              disabled={sessions.length < 50}
            >
              Next →
            </Button>
          </div>
        </>
      )}

      {!loading && selectedEmployee && (
        <>
          <EmployeeStats sessions={sessions} />
          <SessionsTable sessions={sessions} />
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchData(period, selectedEmployee, page - 1)}
              disabled={page === 1}
            >
              ← Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchData(period, selectedEmployee, page + 1)}
              disabled={sessions.length < 50}
            >
              Next →
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Employee Summary Table
   ──────────────────────────────────────────────────────────── */

function EmployeeSummaryTable({
  summaries,
  onViewEmployee,
  period,
}: {
  summaries: EmployeeHistorySummary[];
  onViewEmployee: (empId: string) => void;
  period: FilterPeriod;
}) {
  if (summaries.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
        No attendance data found for this period.
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="p-3 font-medium">Employee</th>
              <th className="p-3 font-medium">Workshop</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Sessions</th>
              <th className="p-3 font-medium">Workshop Time</th>
              <th className="p-3 font-medium">Travel Time</th>
              <th className="p-3 font-medium">On-Site Time</th>
              <th className="p-3 font-medium">Total Time</th>
              <th className="p-3 font-medium">First In</th>
              <th className="p-3 font-medium">Last Activity</th>
              <th className="p-3 font-medium w-20"></th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((s) => {
              const stateConfig = s.current_state
                ? STATE_CONFIG[s.current_state] ?? STATE_CONFIG.off_duty
                : STATE_CONFIG.off_duty;

              // Calculate real-time live duration for the current session
              const liveMins = s.live_session_start
                ? getLiveDurationMinutes(s.live_session_start)
                : 0;

              // Add live minutes to the appropriate state bucket for display
              const workshopDisplay = s.workshop_minutes + (s.current_state === "workshop" ? liveMins : 0);
              const travelDisplay = s.travel_minutes + (s.current_state === "travel" ? liveMins : 0);
              const onsiteDisplay = s.onsite_minutes + (s.current_state === "on_site_job" ? liveMins : 0);
              const totalDisplay = s.total_minutes + liveMins;

              const isLiveWorkshop = s.is_active_now && s.current_state === "workshop";
              const isLiveTravel = s.is_active_now && s.current_state === "travel";
              const isLiveOnsite = s.is_active_now && s.current_state === "on_site_job";

              return (
                <tr key={s.employee_id} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <td className="p-3">
                    <p className="font-medium">{s.employee_name}</p>
                    <p className="text-xs text-muted-foreground">{s.employee_email}</p>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {s.workshop_name ? (
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3" />
                        {s.workshop_name}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-3">
                    {s.is_active_now ? (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${stateConfig.colorClass} ${stateConfig.bgClass}`}>
                        <span className="size-1.5 rounded-full animate-pulse bg-current" />
                        {stateConfig.label}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-state-offduty bg-state-offduty/10">
                        Off Duty
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-mono">{s.total_sessions}</td>
                  <td className="p-3 font-mono text-state-workshop">
                    {isLiveWorkshop ? (
                      <span className="animate-pulse">{formatDuration(workshopDisplay)}</span>
                    ) : (
                      formatDuration(workshopDisplay)
                    )}
                  </td>
                  <td className="p-3 font-mono text-state-travel">
                    {isLiveTravel ? (
                      <span className="animate-pulse">{formatDuration(travelDisplay)}</span>
                    ) : (
                      formatDuration(travelDisplay)
                    )}
                  </td>
                  <td className="p-3 font-mono text-state-onsite">
                    {isLiveOnsite ? (
                      <span className="animate-pulse">{formatDuration(onsiteDisplay)}</span>
                    ) : (
                      formatDuration(onsiteDisplay)
                    )}
                  </td>
                  <td className="p-3 font-mono font-semibold">
                    {s.is_active_now ? (
                      <span className="text-success animate-pulse">{formatDuration(totalDisplay)}</span>
                    ) : (
                      formatDuration(totalDisplay)
                    )}
                  </td>
                  <td className="p-3">{s.first_clock_in ? formatTime(s.first_clock_in) : "—"}</td>
                  <td className="p-3">
                    {s.is_active_now && s.current_state ? (
                      <div>
                        <span className={`text-xs font-semibold ${stateConfig.colorClass}`}>
                          {ACTIVITY_LABEL[s.current_state] ?? s.current_state}
                        </span>
                        {s.live_session_start && (
                          <p className="text-[10px] text-muted-foreground">
                            since {formatTime(s.live_session_start)}
                          </p>
                        )}
                      </div>
                    ) : s.last_activity ? (
                      formatTime(s.last_activity)
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewEmployee(s.employee_id)}
                      title="View details"
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Employee Stats (when viewing a specific employee)
   ──────────────────────────────────────────────────────────── */

function EmployeeStats({ sessions }: { sessions: HistorySession[] }) {
  let workshopMins = 0;
  let travelMins = 0;
  let onsiteMins = 0;

  for (const s of sessions) {
    const isLive = !s.end_time;
    const mins = isLive
      ? getLiveDurationMinutes(s.start_time)
      : (s.duration_minutes ?? 0);

    if (s.state === "workshop") workshopMins += mins;
    if (s.state === "travel") travelMins += mins;
    if (s.state === "on_site_job") onsiteMins += mins;
  }

  const totalMins = workshopMins + travelMins + onsiteMins;
  const hasLive = sessions.some((s) => !s.end_time);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <StatCard label="Total Sessions" value={String(sessions.length)} icon={<Clock className="size-4" />} />
      <StatCard label="Workshop" value={formatDuration(workshopMins)} colorClass="text-state-workshop" icon={<MapPin className="size-4" />} isLive={hasLive} />
      <StatCard label="Travel" value={formatDuration(travelMins)} colorClass="text-state-travel" icon={<Briefcase className="size-4" />} isLive={hasLive} />
      <StatCard label="On-Site" value={formatDuration(onsiteMins)} colorClass="text-state-onsite" icon={<Briefcase className="size-4" />} isLive={hasLive} />
      <StatCard label="Total Time" value={formatDuration(totalMins)} colorClass="text-primary" icon={<Calendar className="size-4" />} isLive={hasLive} />
    </div>
  );
}

function StatCard({
  label,
  value,
  colorClass = "text-foreground",
  icon,
  isLive,
}: {
  label: string;
  value: string;
  colorClass?: string;
  icon?: React.ReactNode;
  isLive?: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <p className={`text-xl font-bold ${colorClass} ${isLive ? "animate-pulse" : ""}`}>{value}</p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   All Sessions Table
   ──────────────────────────────────────────────────────────── */

function SessionsTable({ sessions }: { sessions: HistorySession[] }) {
  if (sessions.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
        No sessions found for this period.
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="p-3 font-medium">Employee</th>
              <th className="p-3 font-medium">Date</th>
              <th className="p-3 font-medium">State</th>
              <th className="p-3 font-medium">Location / Job</th>
              <th className="p-3 font-medium">Clock In</th>
              <th className="p-3 font-medium">Clock Out</th>
              <th className="p-3 font-medium">Duration</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => {
              const config = STATE_CONFIG[s.state] ?? STATE_CONFIG.off_duty;
              const isOpen = !s.end_time;
              const duration = isOpen
                ? getLiveDurationMinutes(s.start_time)
                : s.duration_minutes;

              return (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <td className="p-3">
                    <p className="font-medium">{s.employee_name}</p>
                    <p className="text-xs text-muted-foreground">{s.employee_email}</p>
                  </td>
                  <td className="p-3 text-muted-foreground">{formatDate(s.start_time)}</td>
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
                    {isOpen ? (
                      <span className="text-success animate-pulse">{formatDuration(duration)}</span>
                    ) : (
                      formatDuration(duration)
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
