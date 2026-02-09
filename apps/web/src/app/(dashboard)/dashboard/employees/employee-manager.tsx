"use client";

import { useState } from "react";
import { Button } from "@punchless/ui/components/button";
import { Plus, X, Pencil, Power, Trash2, User, MapPin, IndianRupee } from "lucide-react";
import {
  createEmployee,
  updateEmployee,
  toggleEmployeeStatus,
  deleteEmployee,
} from "@/lib/actions/employee.actions";
import type { EmployeeWithWorkshop } from "@/lib/queries/employee.queries";
import type { Database } from "@punchless/types/database.types";
import { formatCurrency } from "@/lib/utils/formatting";
import { useAction, toastAction } from "@/hooks/use-action";

type WorkshopRow = Database["public"]["Tables"]["workshops"]["Row"];

interface Props {
  employees: EmployeeWithWorkshop[];
  workshops: WorkshopRow[];
  dailyWorkHours: number;
  workingDaysPerMonth: number;
}

export function EmployeeManager({
  employees,
  workshops,
  dailyWorkHours,
  workingDaysPerMonth,
}: Props) {
  const [mode, setMode] = useState<"list" | "add" | "edit">("list");
  const [editingEmployee, setEditingEmployee] =
    useState<EmployeeWithWorkshop | null>(null);

  const hasMultipleWorkshops = workshops.length > 1;
  const hasSingleWorkshop = workshops.length === 1;

  const totalMonthlyHours = dailyWorkHours * workingDaysPerMonth;

  function calcHourlyRate(monthlySalary: number): number {
    if (totalMonthlyHours <= 0) return 0;
    return Math.round((monthlySalary / totalMonthlyHours) * 100) / 100;
  }

  const [addSalary, setAddSalary] = useState(0);
  const [editSalary, setEditSalary] = useState(0);

  const { execute: handleCreate, loading: creating } = useAction(createEmployee, {
    successMessage: "Employee created successfully!",
    onSuccess: () => setMode("list"),
  });

  const { execute: handleUpdate, loading: updating } = useAction(updateEmployee, {
    successMessage: "Employee updated successfully!",
    onSuccess: () => {
      setMode("list");
      setEditingEmployee(null);
    },
  });

  function startAdd() {
    setMode("add");
    setEditingEmployee(null);
    setAddSalary(0);
  }

  function startEdit(emp: EmployeeWithWorkshop) {
    setMode("edit");
    setEditingEmployee(emp);
    setEditSalary(emp.monthly_salary ?? 0);
  }

  function cancel() {
    setMode("list");
    setEditingEmployee(null);
  }

  async function onCreateSubmit(formData: FormData) {
    if (hasSingleWorkshop) formData.set("workshopId", workshops[0].id);
    await handleCreate(formData);
  }

  async function onUpdateSubmit(formData: FormData) {
    if (!editingEmployee) return;
    formData.set("employeeId", editingEmployee.id);
    if (hasSingleWorkshop) formData.set("workshopId", workshops[0].id);
    await handleUpdate(formData);
  }

  const inputClass =
    "w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm";
  const selectClass =
    "w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm appearance-none";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left panel: form */}
      <div className="lg:col-span-1 bg-card border border-border rounded-xl p-5">
        {mode === "list" && (
          <Button onClick={startAdd} className="w-full">
            <Plus className="size-4" /> Add Employee
          </Button>
        )}

        {mode === "add" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add Employee</h2>
              <Button variant="ghost" size="icon" onClick={cancel}>
                <X className="size-4" />
              </Button>
            </div>

            <form action={onCreateSubmit} className="space-y-3">
              <input name="fullName" placeholder="Full name" required className={inputClass} />
              <input name="email" type="email" placeholder="Email" required className={inputClass} />
              <input name="password" type="password" placeholder="Temporary password (min 6)" minLength={6} required className={inputClass} />
              <input name="phone" type="tel" placeholder="Phone (optional)" className={inputClass} />

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Monthly Salary (₹)</label>
                <input
                  name="monthlySalary"
                  type="number"
                  step="1"
                  min={0}
                  placeholder="e.g. 30000"
                  defaultValue={0}
                  onChange={(e) => setAddSalary(Number(e.target.value) || 0)}
                  className={inputClass}
                />
                {addSalary > 0 && (
                  <p className="text-xs text-primary mt-1 flex items-center gap-1">
                    <IndianRupee className="size-3" />
                    Calculated: ₹{calcHourlyRate(addSalary)}/hr
                    <span className="text-muted-foreground">
                      ({dailyWorkHours}h × {workingDaysPerMonth} days = {totalMonthlyHours}h/month)
                    </span>
                  </p>
                )}
              </div>

              {hasMultipleWorkshops && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Assign to Workshop</label>
                  <select name="workshopId" required className={selectClass}>
                    <option value="">Select workshop...</option>
                    {workshops.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {hasSingleWorkshop && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="size-3" />
                  Auto-assigned to: <strong>{workshops[0].name}</strong>
                </p>
              )}

              {workshops.length === 0 && (
                <p className="text-xs text-destructive">⚠ Create a workshop first before adding employees</p>
              )}

              <input type="hidden" name="dailyWorkHours" value={dailyWorkHours} />
              <input type="hidden" name="workingDaysPerMonth" value={workingDaysPerMonth} />

              <Button type="submit" className="w-full" disabled={workshops.length === 0 || creating}>
                {creating ? "Creating..." : "Create Employee"}
              </Button>
            </form>
          </>
        )}

        {mode === "edit" && editingEmployee && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Edit Employee</h2>
              <Button variant="ghost" size="icon" onClick={cancel}>
                <X className="size-4" />
              </Button>
            </div>

            <form action={onUpdateSubmit} className="space-y-3">
              <input name="fullName" placeholder="Full name" required defaultValue={editingEmployee.full_name} className={inputClass} />
              <input value={editingEmployee.email} disabled className={`${inputClass} opacity-50 cursor-not-allowed`} />
              <input name="phone" type="tel" placeholder="Phone (optional)" defaultValue={editingEmployee.phone || ""} className={inputClass} />

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Monthly Salary (₹)</label>
                <input
                  name="monthlySalary"
                  type="number"
                  step="1"
                  min={0}
                  defaultValue={editingEmployee.monthly_salary ?? 0}
                  onChange={(e) => setEditSalary(Number(e.target.value) || 0)}
                  className={inputClass}
                />
                {editSalary > 0 && (
                  <p className="text-xs text-primary mt-1 flex items-center gap-1">
                    <IndianRupee className="size-3" />
                    Calculated: ₹{calcHourlyRate(editSalary)}/hr
                    <span className="text-muted-foreground">
                      ({dailyWorkHours}h × {workingDaysPerMonth} days = {totalMonthlyHours}h/month)
                    </span>
                  </p>
                )}
              </div>

              {hasMultipleWorkshops && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Assigned Workshop</label>
                  <select name="workshopId" required defaultValue={editingEmployee.workshop_id || ""} className={selectClass}>
                    <option value="">Select workshop...</option>
                    {workshops.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {hasSingleWorkshop && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="size-3" />
                  Assigned to: <strong>{workshops[0].name}</strong>
                </p>
              )}

              <input type="hidden" name="dailyWorkHours" value={dailyWorkHours} />
              <input type="hidden" name="workingDaysPerMonth" value={workingDaysPerMonth} />

              <Button type="submit" className="w-full" disabled={updating}>
                {updating ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </>
        )}
      </div>

      {/* Right panel: list */}
      <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-4">Employee List ({employees.length})</h2>

        {employees.length === 0 ? (
          <p className="text-sm text-muted-foreground">No employees yet.</p>
        ) : (
          <div className="space-y-3">
            {employees.map((emp) => (
              <div key={emp.id} className="border border-border rounded-lg p-4 flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <User className="size-4 text-primary shrink-0" />
                    <p className="font-medium">{emp.full_name}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{emp.email}</p>
                  {emp.phone && <p className="text-xs text-muted-foreground">{emp.phone}</p>}
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>{formatCurrency(emp.monthly_salary ?? 0)}/month</span>
                    <span>₹{emp.hourly_rate ?? 0}/hr</span>
                  </div>
                  {emp.workshop_name ? (
                    <p className="text-xs flex items-center gap-1 text-primary">
                      <MapPin className="size-3" />{emp.workshop_name}
                    </p>
                  ) : (
                    <p className="text-xs text-destructive">⚠ No workshop assigned</p>
                  )}
                  <p className={`text-xs font-medium ${emp.is_active ? "text-success" : "text-state-offduty"}`}>
                    {emp.is_active ? "● Active" : "● Inactive"}
                  </p>
                </div>

                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => startEdit(emp)} title="Edit">
                    <Pencil className="size-4" />
                  </Button>
                  <form action={toastAction(toggleEmployeeStatus, emp.is_active ? "Employee deactivated" : "Employee activated")}>
                    <input type="hidden" name="employeeId" value={emp.id} />
                    <input type="hidden" name="nextStatus" value={String(!emp.is_active)} />
                    <Button variant="ghost" size="icon" type="submit" title={emp.is_active ? "Deactivate" : "Activate"}>
                      <Power className={`size-4 ${emp.is_active ? "text-success" : "text-state-offduty"}`} />
                    </Button>
                  </form>
                  <form action={toastAction(deleteEmployee, "Employee deleted")}>
                    <input type="hidden" name="employeeId" value={emp.id} />
                    <Button variant="ghost" size="icon" type="submit" title="Delete">
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
