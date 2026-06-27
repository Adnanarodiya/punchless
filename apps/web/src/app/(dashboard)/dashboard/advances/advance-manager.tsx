"use client";

import { useState } from "react";
import { Button } from "@punchless/ui/components/button";
import { Plus, X, Wallet } from "lucide-react";
import { createAdvance, deleteAdvance } from "@/lib/actions/advance.actions";
import type { AdvanceWithEmployee } from "@/lib/queries/advance.queries";
import type { EmployeeWithWorkshop } from "@/lib/queries/employee.queries";
import { MaskedAmount } from "@/components/masked-amount";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils/formatting";
import { useAction } from "@/hooks/use-action";
import { DeleteConfirmButton } from "@/components/delete-confirm-button";

interface Props {
  advances: AdvanceWithEmployee[];
  employees: EmployeeWithWorkshop[];
}

export function AdvanceManager({ advances, employees }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [filterText, setFilterText] = useState("");

  const recordedAdvances = advances.filter((a) => a.status === "approved");
  const totalAmount = recordedAdvances.reduce((sum, a) => sum + a.amount, 0);

  const filtered = recordedAdvances.filter((a) =>
    a.employee_name.toLowerCase().includes(filterText.toLowerCase())
  );

  const defaultMonth = (() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  })();

  const { execute: execCreate, loading: creating } = useAction(createAdvance, {
    successMessage: "Advance recorded — will be deducted on the salary report.",
    onSuccess: () => setShowForm(false),
  });

  const { execute: execDelete, loading: deleting } = useAction(deleteAdvance, {
    successMessage: "Advance removed",
  });

  async function handleCreate(formData: FormData) {
    await execCreate(formData);
  }

  const inputClass =
    "w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm";
  const selectClass =
    "w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm appearance-none";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 max-w-md">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Advances recorded</p>
          <p className="text-2xl font-bold text-primary">{recordedAdvances.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Total to deduct</p>
          <p className="text-2xl font-bold text-primary">
            <MaskedAmount amount={totalAmount} />
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground max-w-xl">
          Record cash advances you gave staff. Amounts are deducted on the Salary
          report for the month you choose.
        </p>

        <div className="flex items-center gap-2 shrink-0">
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
                <Plus className="size-4" /> Record Advance
              </>
            )}
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Wallet className="size-5 text-primary" />
            Record Advance
          </h2>
          <form
            action={handleCreate}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
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
                Deduct from Month *
              </label>
              <input
                name="salaryMonth"
                type="month"
                defaultValue={defaultMonth}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Note
              </label>
              <input
                name="reason"
                placeholder="e.g. Festival advance"
                className={inputClass}
              />
            </div>

            <div className="md:col-span-2 lg:col-span-4 flex justify-end">
              <Button type="submit" loading={creating} disabled={creating}>
                <Plus className="size-4" /> Save Advance
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground bg-muted/50">
                <th className="p-4 font-medium">Employee</th>
                <th className="p-4 font-medium text-right">Amount</th>
                <th className="p-4 font-medium">Note</th>
                <th className="p-4 font-medium">Deduct Month</th>
                <th className="p-4 font-medium">Recorded</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-8 text-center text-muted-foreground"
                  >
                    No advances recorded yet. Use Record Advance when you pay
                    staff early.
                  </td>
                </tr>
              ) : (
                filtered.map((adv) => (
                  <tr
                    key={adv.id}
                    className="border-b border-border last:border-0 hover:bg-muted/50"
                  >
                    <td className="p-4 font-medium">{adv.employee_name}</td>
                    <td className="p-4 text-right font-bold text-primary">
                      {formatCurrency(adv.amount)}
                    </td>
                    <td className="p-4 text-muted-foreground max-w-[200px] truncate">
                      {adv.reason || "—"}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {adv.salary_month || "—"}
                    </td>
                    <td className="p-4 text-muted-foreground text-xs">
                      <div>{formatDate(adv.requested_at)}</div>
                      <div>{formatTime(adv.requested_at)}</div>
                    </td>
                    <td className="p-4 text-right">
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}