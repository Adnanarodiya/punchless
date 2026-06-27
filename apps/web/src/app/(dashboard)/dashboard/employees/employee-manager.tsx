"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@punchless/ui/components/button";
import { Modal } from "@punchless/ui/components/modal";
import { PageHeader } from "@/components/page-header";
import { cn } from "@punchless/ui/lib/utils";
import {
  Plus,
  Pencil,
  Power,
  User,
  MapPin,
  IndianRupee,
  FileText,
  Banknote,
  Users,
  UserCheck,
  Search,
} from "lucide-react";
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
  const [formOpen, setFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] =
    useState<EmployeeWithWorkshop | null>(null);
  const [search, setSearch] = useState("");

  const hasMultipleWorkshops = workshops.length > 1;
  const hasSingleWorkshop = workshops.length === 1;
  const totalMonthlyHours = dailyWorkHours * workingDaysPerMonth;
  const isEdit = editingEmployee !== null;

  const activeCount = employees.filter((e) => e.is_active).length;

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return employees;
    return employees.filter((emp) =>
      [
        emp.full_name,
        emp.email,
        emp.phone,
        emp.post_name,
        emp.workshop_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [employees, search]);

  function calcHourlyRate(monthlySalary: number): number {
    if (totalMonthlyHours <= 0) return 0;
    return Math.round((monthlySalary / totalMonthlyHours) * 100) / 100;
  }

  const [formSalary, setFormSalary] = useState(0);

  const { execute: handleCreate, loading: creating } = useAction(createEmployee, {
    successMessage: "Employee created successfully!",
    onSuccess: () => closeForm(),
  });

  const { execute: handleUpdate, loading: updating } = useAction(updateEmployee, {
    successMessage: "Employee updated successfully!",
    onSuccess: () => closeForm(),
  });

  const { execute: execDelete, loading: deleting } = useAction(deleteEmployee, {
    successMessage: "Employee deleted",
  });

  function openAdd() {
    setEditingEmployee(null);
    setFormSalary(0);
    setFormOpen(true);
  }

  function openEdit(emp: EmployeeWithWorkshop) {
    setEditingEmployee(emp);
    setFormSalary(emp.monthly_salary ?? 0);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingEmployee(null);
    setFormSalary(0);
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
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description="Manage staff names, designation, and monthly salary for fingerprint payroll."
      >
        <Button onClick={openAdd}>
          <Plus className="size-4" />
          Add Employee
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total Employees</p>
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Users className="size-4" />
            </div>
          </div>
          <p className="text-3xl font-bold">{employees.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Active</p>
            <div className="rounded-lg bg-success/10 p-2 text-success">
              <UserCheck className="size-4" />
            </div>
          </div>
          <p className="text-3xl font-bold">{activeCount}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employees…"
            className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm"
          />
        </div>

        {filteredEmployees.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <User className="mx-auto mb-3 size-10 text-muted-foreground" />
            <p className="font-medium text-foreground">
              {employees.length === 0 ? "No employees yet" : "No matches found"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {employees.length === 0
                ? "Add your first team member to get started."
                : "Try a different search term."}
            </p>
            {employees.length === 0 ? (
              <Button className="mt-4" onClick={openAdd}>
                <Plus className="size-4" />
                Add Employee
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredEmployees.map((emp) => (
              <EmployeeCard
                key={emp.id}
                employee={emp}
                deleting={deleting}
                onEdit={() => openEdit(emp)}
                onDelete={async () => {
                  const fd = new FormData();
                  fd.set("employeeId", emp.id);
                  await execDelete(fd);
                }}
              />
            ))}
          </div>
        )}
      </div>

      <Modal
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) closeForm();
          else setFormOpen(true);
        }}
        title={isEdit ? "Edit Employee" : "Add Employee"}
        className="max-h-[90vh] max-w-lg overflow-y-auto"
      >
        <form
          action={isEdit ? onUpdateSubmit : onCreateSubmit}
          className="space-y-3"
        >
          <input
            name="fullName"
            placeholder="Full name"
            required
            defaultValue={editingEmployee?.full_name}
            className={inputClass}
          />
          {isEdit ? (
            <input
              value={editingEmployee?.email ?? ""}
              disabled
              className={`${inputClass} cursor-not-allowed opacity-50`}
            />
          ) : (
            <>
              <input
                name="email"
                type="email"
                placeholder="Email"
                required
                className={inputClass}
              />
              <input
                name="password"
                type="password"
                placeholder="Temporary password (min 6)"
                minLength={6}
                required
                className={inputClass}
              />
            </>
          )}
          <input
            name="phone"
            type="tel"
            placeholder="Phone (optional)"
            defaultValue={editingEmployee?.phone || ""}
            className={inputClass}
          />
          <input
            name="address"
            placeholder="Address (optional)"
            defaultValue={editingEmployee?.address || ""}
            className={inputClass}
          />
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              Post
            </label>
            <select
              name="postId"
              defaultValue={editingEmployee?.post_id || ""}
              className={selectClass}
            >
              <option value="">No post</option>
              {posts.map((post) => (
                <option key={post.id} value={post.id}>
                  {post.name}
                </option>
              ))}
            </select>
          </div>
          <input
            name="joiningDate"
            type="date"
            defaultValue={editingEmployee?.joining_date || ""}
            className={inputClass}
          />
          <input
            name="accountNo"
            placeholder="Bank account no. (optional)"
            defaultValue={editingEmployee?.account_no || ""}
            className={inputClass}
          />
          <input
            name="ifscCode"
            placeholder="IFSC code (optional)"
            defaultValue={editingEmployee?.ifsc_code || ""}
            className={inputClass}
          />

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              Monthly Salary (₹)
            </label>
            <input
              name="monthlySalary"
              type="number"
              step="1"
              min={0}
              placeholder="e.g. 30000"
              defaultValue={editingEmployee?.monthly_salary ?? 0}
              onChange={(e) => setFormSalary(Number(e.target.value) || 0)}
              className={inputClass}
            />
            {formSalary > 0 ? (
              <p className="mt-1 flex items-center gap-1 text-xs text-primary">
                <IndianRupee className="size-3" />
                Calculated: ₹{calcHourlyRate(formSalary)}/hr
                <span className="text-muted-foreground">
                  ({dailyWorkHours}h × {workingDaysPerMonth} days ={" "}
                  {totalMonthlyHours}h/month)
                </span>
              </p>
            ) : null}
          </div>

          {hasMultipleWorkshops ? (
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                {isEdit ? "Assigned Workshop" : "Assign to Workshop"}
              </label>
              <select
                name="workshopId"
                required
                defaultValue={editingEmployee?.workshop_id || ""}
                className={selectClass}
              >
                <option value="">Select workshop…</option>
                {workshops.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {hasSingleWorkshop ? (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3" />
              {isEdit ? "Assigned to" : "Auto-assigned to"}:{" "}
              <strong>{workshops[0].name}</strong>
            </p>
          ) : null}

          <input type="hidden" name="dailyWorkHours" value={dailyWorkHours} />
          <input
            type="hidden"
            name="workingDaysPerMonth"
            value={workingDaysPerMonth}
          />

          <Button
            type="submit"
            className="w-full"
            loading={isEdit ? updating : creating}
            disabled={isEdit ? updating : creating}
          >
            {isEdit ? "Save Changes" : "Create Employee"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}

function EmployeeCard({
  employee: emp,
  deleting,
  onEdit,
  onDelete,
}: {
  employee: EmployeeWithWorkshop;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}) {
  const duration = formatJoiningDuration(emp.joining_date);

  return (
    <article
      className={cn(
        "flex flex-col rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-sm",
        !emp.is_active && "opacity-75"
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">
              {emp.full_name}
            </p>
            {emp.post_name ? (
              <p className="truncate text-xs text-muted-foreground">
                {emp.post_name}
              </p>
            ) : null}
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            emp.is_active
              ? "bg-success/10 text-success"
              : "bg-muted text-muted-foreground"
          )}
        >
          {emp.is_active ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="mb-3 flex-1 space-y-1 text-xs text-muted-foreground">
        <p className="truncate">{emp.email}</p>
        {emp.phone ? <p>{emp.phone}</p> : null}
        {emp.joining_date ? (
          <p>
            Joined {emp.joining_date}
            {duration ? ` · ${duration}` : ""}
          </p>
        ) : null}
        <p className="font-medium text-foreground">
          {formatCurrency(emp.monthly_salary ?? 0)}
          <span className="font-normal text-muted-foreground">/mo</span>
          <span className="mx-1 text-border">·</span>
          ₹{emp.hourly_rate ?? 0}/hr
        </p>
        {emp.workshop_name ? (
          <p className="flex items-center gap-1 text-primary">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">{emp.workshop_name}</span>
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3">
        <div className="flex gap-0.5">
          <Link
            href={`/dashboard/salary/payments?employee=${emp.id}&openForm=1`}
          >
            <Button variant="ghost" size="icon" className="size-8" title="Quick payment">
              <Banknote className="size-3.5" />
            </Button>
          </Link>
          <Link href={`/dashboard/employees/${emp.id}/statement`}>
            <Button variant="ghost" size="icon" className="size-8" title="Staff statement">
              <FileText className="size-3.5" />
            </Button>
          </Link>
          {/* GPS attendance history — paused
          <Link href={`/dashboard/history?employee=${emp.id}`}>
            <Button variant="ghost" size="icon" className="size-8" title="History">
              <History className="size-3.5" />
            </Button>
          </Link>
          */}
        </div>
        <div className="flex gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={onEdit}
            title="Edit"
          >
            <Pencil className="size-3.5" />
          </Button>
          <form
            action={toastAction(
              toggleEmployeeStatus,
              emp.is_active ? "Employee deactivated" : "Employee activated"
            )}
          >
            <input type="hidden" name="employeeId" value={emp.id} />
            <input
              type="hidden"
              name="nextStatus"
              value={String(!emp.is_active)}
            />
            <Button
              variant="ghost"
              size="icon"
              type="submit"
              className="size-8"
              title={
                emp.is_active
                  ? "Deactivate — hide from salary & payroll lists"
                  : "Activate — show again in salary & payroll"
              }
            >
              <Power
                className={cn(
                  "size-3.5",
                  emp.is_active ? "text-success" : "text-muted-foreground"
                )}
              />
            </Button>
          </form>
          <DeleteConfirmButton
            entityName={emp.full_name}
            entityType="employee"
            loading={deleting}
            onConfirm={onDelete}
          />
        </div>
      </div>
    </article>
  );
}