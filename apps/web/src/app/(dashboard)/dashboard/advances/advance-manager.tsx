"use client";

import { useState } from "react";
import { Button } from "@punchless/ui/components/button";
import { Modal } from "@punchless/ui/components/modal";
import {
  Plus,
  X,
  Check,
  XCircle,
  Wallet,
  Clock,
  CheckCircle2,
  Ban,
  MessageSquare,
} from "lucide-react";
import {
  createAdvance,
  approveAdvance,
  rejectAdvance,
  deleteAdvance,
} from "@/lib/actions/advance.actions";
import type { AdvanceWithEmployee } from "@/lib/queries/advance.queries";
import type { EmployeeWithWorkshop } from "@/lib/queries/employee.queries";
import { MaskedAmount } from "@/components/masked-amount";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils/formatting";
import { useAction } from "@/hooks/use-action";
import { DeleteConfirmButton } from "@/components/delete-confirm-button";
import { toast } from "sonner";

interface Props {
  advances: AdvanceWithEmployee[];
  employees: EmployeeWithWorkshop[];
}

type FilterStatus = "all" | "pending" | "approved" | "rejected";

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: typeof Clock; colorClass: string; bgClass: string }
> = {
  pending: {
    label: "Pending",
    icon: Clock,
    colorClass: "text-warning",
    bgClass: "bg-warning/10",
  },
  approved: {
    label: "Approved",
    icon: CheckCircle2,
    colorClass: "text-success",
    bgClass: "bg-success/10",
  },
  rejected: {
    label: "Rejected",
    icon: Ban,
    colorClass: "text-destructive",
    bgClass: "bg-destructive/10",
  },
};

export function AdvanceManager({ advances, employees }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterText, setFilterText] = useState("");
  const [notesModal, setNotesModal] = useState<{
    advanceId: string;
    action: "approve" | "reject";
  } | null>(null);
  const [notesText, setNotesText] = useState("");

  // Counts for stat cards
  const pendingCount = advances.filter((a) => a.status === "pending").length;
  const approvedCount = advances.filter((a) => a.status === "approved").length;
  const rejectedCount = advances.filter((a) => a.status === "rejected").length;
  const totalApprovedAmount = advances
    .filter((a) => a.status === "approved")
    .reduce((sum, a) => sum + a.amount, 0);

  // Filtered list
  const filtered = advances
    .filter((a) => filterStatus === "all" || a.status === filterStatus)
    .filter((a) =>
      a.employee_name.toLowerCase().includes(filterText.toLowerCase())
    );

  // Generate default salary_month (current month)
  const defaultMonth = (() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  })();

  const { execute: execCreate, loading: creating } = useAction(createAdvance, {
    successMessage: "Advance request created!",
    onSuccess: () => setShowForm(false),
  });

  const { execute: execDelete, loading: deleting } = useAction(deleteAdvance, {
    successMessage: "Advance deleted",
  });

  async function handleCreate(formData: FormData) {
    await execCreate(formData);
  }

  async function handleApproveWithNotes() {
    if (!notesModal) return;
    const fd = new FormData();
    fd.set("advanceId", notesModal.advanceId);
    fd.set("notes", notesText);
    if (notesModal.action === "approve") {
      const result = await approveAdvance(fd);
      if (result.success) toast.success("Advance approved!");
      else toast.error(result.error || "Failed to approve");
    } else {
      const result = await rejectAdvance(fd);
      if (result.success) toast.success("Advance rejected");
      else toast.error(result.error || "Failed to reject");
    }
    setNotesModal(null);
    setNotesText("");
  }

  function openNotesModal(advanceId: string, action: "approve" | "reject") {
    setNotesModal({ advanceId, action });
    setNotesText("");
  }

  const inputClass =
    "w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm";
  const selectClass =
    "w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm appearance-none";

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-warning">{pendingCount}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Approved</p>
          <p className="text-2xl font-bold text-success">{approvedCount}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Rejected</p>
          <p className="text-2xl font-bold text-destructive">{rejectedCount}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Total Approved</p>
          <p className="text-2xl font-bold text-primary">
            <MaskedAmount amount={totalApprovedAmount} />
          </p>
        </div>
      </div>

      {/* Controls row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {/* Status filter tabs */}
          {(["all", "pending", "approved", "rejected"] as FilterStatus[]).map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  filterStatus === status
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {status === "all"
                  ? `All (${advances.length})`
                  : `${status.charAt(0).toUpperCase() + status.slice(1)} (${
                      advances.filter((a) => a.status === status).length
                    })`}
              </button>
            )
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            placeholder="Search employee..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="h-10 px-3 rounded-lg border border-input bg-background text-sm w-full md:w-56"
          />
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? (
              <>
                <X className="size-4" /> Cancel
              </>
            ) : (
              <>
                <Plus className="size-4" /> New Advance
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Create advance form */}
      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Wallet className="size-5 text-primary" />
            Record Advance Request
          </h2>
          <form action={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Employee *
              </label>
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
              <label className="text-xs text-muted-foreground mb-1 block">
                Amount (₹) *
              </label>
              <input
                name="amount"
                type="number"
                step="0.01"
                min="1"
                placeholder="e.g. 5000"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Deduct from Month
              </label>
              <input
                name="salaryMonth"
                type="month"
                defaultValue={defaultMonth}
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Reason
              </label>
              <input
                name="reason"
                placeholder="e.g. Medical emergency"
                className={inputClass}
              />
            </div>

            <div className="md:col-span-2 lg:col-span-4 flex justify-end">
              <Button type="submit" loading={creating} disabled={creating}>
                <Plus className="size-4" /> Create Advance Request
              </Button>
            </div>
          </form>
        </div>
      )}

      <Modal
        open={!!notesModal}
        onOpenChange={(open) => {
          if (!open) {
            setNotesModal(null);
            setNotesText("");
          }
        }}
        title={notesModal ? `${notesModal.action === "approve" ? "Approve" : "Reject"} Advance` : undefined}
      >
        {notesModal ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add an optional note for this{" "}
              {notesModal.action === "approve" ? "approval" : "rejection"}.
            </p>
            <textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Optional note..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm resize-none"
            />
            <div className="flex justify-end">
              <Button
                variant={notesModal.action === "approve" ? "default" : "destructive"}
                onClick={handleApproveWithNotes}
              >
                {notesModal.action === "approve" ? (
                  <>
                    <Check className="size-4" /> Approve
                  </>
                ) : (
                  <>
                    <XCircle className="size-4" /> Reject
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Advances list */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground bg-muted/50">
                <th className="p-4 font-medium">Employee</th>
                <th className="p-4 font-medium text-right">Amount</th>
                <th className="p-4 font-medium">Reason</th>
                <th className="p-4 font-medium">Deduct Month</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Requested</th>
                <th className="p-4 font-medium">Notes</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="p-8 text-center text-muted-foreground"
                  >
                    No advance requests found.
                  </td>
                </tr>
              ) : (
                filtered.map((adv) => {
                  const config = STATUS_CONFIG[adv.status] ?? STATUS_CONFIG.pending;
                  const StatusIcon = config.icon;

                  return (
                    <tr
                      key={adv.id}
                      className="border-b border-border last:border-0 hover:bg-muted/50"
                    >
                      {/* Employee */}
                      <td className="p-4 font-medium">{adv.employee_name}</td>

                      {/* Amount */}
                      <td className="p-4 text-right font-bold text-primary">
                        {formatCurrency(adv.amount)}
                      </td>

                      {/* Reason */}
                      <td className="p-4 text-muted-foreground max-w-[200px] truncate">
                        {adv.reason || "—"}
                      </td>

                      {/* Salary month */}
                      <td className="p-4 text-muted-foreground">
                        {adv.salary_month || "—"}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgClass} ${config.colorClass}`}
                        >
                          <StatusIcon className="size-3" />
                          {config.label}
                        </span>
                      </td>

                      {/* Requested date */}
                      <td className="p-4 text-muted-foreground text-xs">
                        <div>{formatDate(adv.requested_at)}</div>
                        <div>{formatTime(adv.requested_at)}</div>
                      </td>

                      {/* Notes */}
                      <td className="p-4">
                        {adv.notes ? (
                          <span
                            className="text-xs text-muted-foreground flex items-start gap-1 max-w-[180px]"
                            title={adv.notes}
                          >
                            <MessageSquare className="size-3 shrink-0 mt-0.5" />
                            <span className="truncate">{adv.notes}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                        {adv.approver_name && (
                          <p className="text-xs text-muted-foreground mt-1">
                            by {adv.approver_name}
                          </p>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {adv.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  openNotesModal(adv.id, "approve")
                                }
                                title="Approve"
                                className="text-success hover:text-success"
                              >
                                <Check className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  openNotesModal(adv.id, "reject")
                                }
                                title="Reject"
                                className="text-destructive hover:text-destructive"
                              >
                                <XCircle className="size-4" />
                              </Button>
                            </>
                          )}
                          <DeleteConfirmButton
                            entityName={`${adv.employee_name} — ${formatCurrency(adv.amount)}`}
                            entityType="advance"
                            loading={deleting}
                            onConfirm={async () => {
                              const fd = new FormData();
                              fd.set("advanceId", adv.id);
                              await execDelete(fd);
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
