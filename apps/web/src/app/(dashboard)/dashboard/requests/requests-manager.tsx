"use client";

import { useState } from "react";
import { Button } from "@punchless/ui/components/button";
import { Check, X, Clock, MessageSquare } from "lucide-react";
import {
  approveCorrectionRequest,
  rejectCorrectionRequest,
} from "@/lib/actions/correction.actions";
import type { CorrectionRequestWithEmployee } from "@/lib/queries/correction.queries";
import { formatTime, formatDate } from "@/lib/utils/formatting";
import { useAction, toastAction } from "@/hooks/use-action";

type StatusFilter = "all" | "pending" | "approved" | "rejected";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending", color: "text-yellow-600", bg: "bg-yellow-50" },
  approved: { label: "Approved", color: "text-green-600", bg: "bg-green-50" },
  rejected: { label: "Rejected", color: "text-red-600", bg: "bg-red-50" },
};

const TYPE_LABEL: Record<string, string> = {
  break_correction: "☕ Break Correction",
  session_correction: "🔧 Session Correction",
  missing_session: "➕ Missing Session",
};

interface Props {
  initialRequests: CorrectionRequestWithEmployee[];
}

export function RequestsManager({ initialRequests }: Props) {
  const [requests] = useState(initialRequests);
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [showNotes, setShowNotes] = useState<string | null>(null);

  const filtered = filter === "all"
    ? requests
    : requests.filter((r) => r.status === filter);

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {(["pending", "all", "approved", "rejected"] as StatusFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "pending" ? `Pending (${pendingCount})` : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
          {filter === "pending"
            ? "No pending correction requests 🎉"
            : "No requests found."}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => {
            const statusConfig = STATUS_CONFIG[r.status ?? "pending"];
            const isPending = r.status === "pending";

            return (
              <div key={r.id} className="bg-card border border-border rounded-xl p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{r.employee_name}</p>
                    <p className="text-xs text-muted-foreground">{r.employee_email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.color} ${statusConfig.bg}`}>
                      {statusConfig.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatDate(r.created_at)}</span>
                  </div>
                </div>

                {/* Type & Date */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{TYPE_LABEL[r.request_type] ?? r.request_type}</span>
                  <span className="text-xs text-muted-foreground">Date: {r.date}</span>
                </div>

                {/* Original vs Requested */}
                <div className="grid grid-cols-2 gap-4 bg-muted/50 rounded-lg p-4">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1">Original</p>
                    <p className="text-sm font-mono">
                      {formatTime(r.original_start_time)} → {formatTime(r.original_end_time)}
                    </p>
                    {r.original_state && (
                      <p className="text-xs text-muted-foreground mt-1 capitalize">{r.original_state}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-primary font-medium mb-1">Requested Change</p>
                    <p className="text-sm font-mono text-primary font-semibold">
                      {formatTime(r.requested_start_time)} → {formatTime(r.requested_end_time)}
                    </p>
                    {r.requested_state && (
                      <p className="text-xs text-primary mt-1 capitalize">{r.requested_state}</p>
                    )}
                  </div>
                </div>

                {/* Reason */}
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Reason: </span>
                    {r.reason}
                  </p>
                </div>

                {/* Admin Notes (if already reviewed) */}
                {r.admin_notes && (
                  <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
                    <p className="text-sm text-primary">
                      <span className="font-medium">Admin Notes: </span>
                      {r.admin_notes}
                    </p>
                  </div>
                )}

                {/* Actions (only for pending) */}
                {isPending && (
                  <div className="flex items-center gap-3 pt-2 border-t border-border">
                    {/* Optional notes input */}
                    <button
                      onClick={() => setShowNotes(showNotes === r.id ? null : r.id)}
                      className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground"
                    >
                      <MessageSquare className="size-3" />
                      {showNotes === r.id ? "Hide notes" : "Add notes"}
                    </button>

                    <div className="flex-1" />

                    {/* Reject */}
                    <form action={toastAction(rejectCorrectionRequest, "Request rejected")}>
                      <input type="hidden" name="requestId" value={r.id} />
                      <input type="hidden" name="adminNotes" value={notesMap[r.id] ?? ""} />
                      <Button variant="outline" size="sm" type="submit" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                        <X className="size-4" />
                        Reject
                      </Button>
                    </form>

                    {/* Approve */}
                    <form action={toastAction(approveCorrectionRequest, "Request approved & hours updated!")}>
                      <input type="hidden" name="requestId" value={r.id} />
                      <input type="hidden" name="adminNotes" value={notesMap[r.id] ?? ""} />
                      <Button size="sm" type="submit" className="bg-green-600 hover:bg-green-700">
                        <Check className="size-4" />
                        Approve
                      </Button>
                    </form>
                  </div>
                )}

                {/* Notes input (collapsible) */}
                {isPending && showNotes === r.id && (
                  <input
                    type="text"
                    placeholder="Add a note (optional)..."
                    value={notesMap[r.id] ?? ""}
                    onChange={(e) => setNotesMap((m) => ({ ...m, [r.id]: e.target.value }))}
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
