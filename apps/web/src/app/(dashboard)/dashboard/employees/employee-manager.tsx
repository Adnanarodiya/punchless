"use client";

import { useState } from "react";
import { Button } from "@punchless/ui/components/button";
import {
  Plus,
  X,
  Pencil,
  Power,
  User,
  MapPin,
  IndianRupee,
  History,
  FileText,
  Banknote,
} from "lucide-react";
import Link from "next/link";
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
import { DeleteConfirmButton } from "@/components/delete-confirm-button";

type WorkshopRow = Database["public"]["Tables"]["workshops"]["Row"];
type PostRow = Database["public"]["Tables"]["posts"]["Row"];

interface Props {
  employees: EmployeeWithWorkshop[];
  workshops: WorkshopRow[];
  posts: PostRow[];
  dailyWorkHours: number;
  workingDaysPerMonth: number;
}

function formatJoiningDuration(joiningDate: string | null | undefined) {
  if (!joiningDate) return null;
  const start = new Date(joiningDate);
  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();
  if (days < 0) {
    months -= 1;
    days += 30;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  const parts = [];
  if (years > 0) parts.push(`${years}y`);
  if (months > 0) parts.push(`${months}m`);
  if (days > 0 || parts.length === 0) parts.push(`${days}d`);
  return parts.join(" ");
}

export function EmployeeManager({
  employees,
  workshops,
  posts,
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

  const { execute: execDelete, loading: deleting } = useAction(deleteEmployee, {
    successMessage: "Employee deleted",
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
              <input name="address" placeholder="Address (optional)" className={inputClass} />
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Post</label>
                <select name="postId" className={selectClass}>
                  <option value="">No post</option>
                  {posts.map((post) => (
                    <option key={post.id} value={post.id}>{post.name}</option>
                  ))}
                </select>
              </div>
              <input name="joiningDate" type="date" className={inputClass} />
              <input name="accountNo" placeholder="Bank account no. (optional)" className={inputClass} />
              <input name="ifscCode" placeholder="IFSC code (optional)" className={inputClass} />

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

              <Button type="submit" className="w-full" loading={creating} disabled={workshops.length === 0 || creating}>
                Create Employee
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
              <input name="address" placeholder="Address (optional)" defaultValue={editingEmployee.address || ""} className={inputClass} />
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Post</label>
                <select name="postId" defaultValue={editingEmployee.post_id || ""} className={selectClass}>
                  <option value="">No post</option>
                  {posts.map((post) => (
                    <option key={post.id} value={post.id}>{post.name}</option>
                  ))}
                </select>
              </div>
              <input name="joiningDate" type="date" defaultValue={editingEmployee.joining_date || ""} className={inputClass} />
              <input name="accountNo" placeholder="Bank account no." defaultValue={editingEmployee.account_no || ""} className={inputClass} />
              <input name="ifscCode" placeholder="IFSC code" defaultValue={editingEmployee.ifsc_code || ""} className={inputClass} />

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

              <Button type="submit" className="w-full" loading={updating} disabled={updating}>
                Save Changes
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
                  {emp.post_name && (
                    <p className="text-xs text-muted-foreground">{emp.post_name}</p>
                  )}
                  {emp.joining_date && (
                    <p className="text-xs text-muted-foreground">
                      Joined {emp.joining_date} ({formatJoiningDuration(emp.joining_date)})
                    </p>
                  )}
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
                  <Link href={`/dashboard/salary/payments?employee=${emp.id}`}>
                    <Button variant="ghost" size="icon" title="Quick payment">
                      <Banknote className="size-4 text-primary" />
                    </Button>
                  </Link>
                  <Link href={`/dashboard/employees/${emp.id}/statement`}>
                    <Button variant="ghost" size="icon" title="Staff statement">
                      <FileText className="size-4 text-primary" />
                    </Button>
                  </Link>
                  <Link href={`/dashboard/history?employee=${emp.id}`}>
                    <Button variant="ghost" size="icon" title="View History">
                      <History className="size-4 text-primary" />
                    </Button>
                  </Link>
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
                  <DeleteConfirmButton
                    entityName={emp.full_name}
                    entityType="employee"
                    loading={deleting}
                    onConfirm={async () => {
                      const fd = new FormData();
                      fd.set("employeeId", emp.id);
                      await execDelete(fd);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
