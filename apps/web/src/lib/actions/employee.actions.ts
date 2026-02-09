"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { protectedAction } from "@/lib/server/protected-action";
import { createEmployeeSchema, updateEmployeeSchema } from "@/lib/validations/employee.schema";
import type { ActionResult } from "@/lib/utils/action-result";

function calcHourlyRate(
  monthlySalary: number,
  dailyWorkHours: number,
  workingDaysPerMonth: number
): number {
  const totalMonthlyHours = dailyWorkHours * workingDaysPerMonth;
  if (totalMonthlyHours <= 0) return 0;
  return Math.round((monthlySalary / totalMonthlyHours) * 100) / 100;
}

export const createEmployee = protectedAction<FormData>({
  roles: ["owner", "admin"],
})(async (formData, { me }) => {
  const parsed = createEmployeeSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone"),
    monthlySalary: formData.get("monthlySalary"),
    workshopId: formData.get("workshopId"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const { fullName, email, password, phone, monthlySalary, workshopId } = parsed.data;
  const dailyWorkHours = Number(formData.get("dailyWorkHours") || 8);
  const workingDaysPerMonth = Number(formData.get("workingDaysPerMonth") || 26);
  const hourlyRate = calcHourlyRate(monthlySalary, dailyWorkHours, workingDaysPerMonth);

  const admin = createAdminClient();

  const { data: createdAuth, error: authError } = await admin.auth.admin.createUser({
    email: email.toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: "employee" },
  });

  if (authError || !createdAuth.user) {
    return { success: false, error: authError?.message || "Failed to create auth user" };
  }

  const { error: profileError } = await admin.from("users").insert({
    id: createdAuth.user.id,
    company_id: me.company_id,
    role: "employee",
    full_name: fullName,
    email: email.toLowerCase(),
    phone: phone || null,
    monthly_salary: monthlySalary,
    hourly_rate: hourlyRate,
    daily_shift_hours: dailyWorkHours,
    workshop_id: workshopId || null,
    is_active: true,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(createdAuth.user.id);
    return { success: false, error: profileError.message };
  }

  revalidatePath("/dashboard/employees");
  return { success: true };
});

export const updateEmployee = protectedAction<FormData>({
  roles: ["owner", "admin"],
})(async (formData, { supabase }) => {
  const employeeId = String(formData.get("employeeId") || "");
  if (!employeeId) return { success: false, error: "Employee ID missing" };

  const parsed = updateEmployeeSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    monthlySalary: formData.get("monthlySalary"),
    workshopId: formData.get("workshopId"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const { fullName, phone, monthlySalary, workshopId } = parsed.data;
  const dailyWorkHours = Number(formData.get("dailyWorkHours") || 8);
  const workingDaysPerMonth = Number(formData.get("workingDaysPerMonth") || 26);
  const hourlyRate = calcHourlyRate(monthlySalary, dailyWorkHours, workingDaysPerMonth);

  const { error } = await supabase
    .from("users")
    .update({
      full_name: fullName,
      phone: phone || null,
      monthly_salary: monthlySalary,
      hourly_rate: hourlyRate,
      daily_shift_hours: dailyWorkHours,
      workshop_id: workshopId || null,
    } as unknown as never)
    .eq("id", employeeId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/employees");
  return { success: true };
});

export const toggleEmployeeStatus = protectedAction<FormData>({
  roles: ["owner", "admin"],
})(async (formData, { supabase }) => {
  const employeeId = String(formData.get("employeeId") || "");
  const nextStatus = String(formData.get("nextStatus") || "false") === "true";

  if (!employeeId) return { success: false, error: "Employee ID missing" };

  const { error } = await supabase
    .from("users")
    .update({ is_active: nextStatus } as unknown as never)
    .eq("id", employeeId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/employees");
  return { success: true };
});

export const deleteEmployee = protectedAction<FormData>({
  roles: ["owner", "admin"],
})(async (formData) => {
  const admin = createAdminClient();
  const employeeId = String(formData.get("employeeId") || "");
  if (!employeeId) return { success: false, error: "Employee ID missing" };

  const { error } = await admin.auth.admin.deleteUser(employeeId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/employees");
  return { success: true };
});
