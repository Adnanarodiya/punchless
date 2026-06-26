"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { protectedAction } from "@/lib/server/protected-action";
import { createEmployeeSchema, updateEmployeeSchema } from "@/lib/validations/employee.schema";


function revalidateEmployeePages(employeeId?: string) {
  revalidatePath("/dashboard/employees");
  revalidatePath("/dashboard/salary/deposits");
  revalidatePath("/dashboard/salary");
  if (employeeId) {
    revalidatePath(`/dashboard/employees/${employeeId}/statement`);
  }
}

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
  audit: { action: "create_employee", entityType: "employee" },
})(async (formData, { supabase, me }) => {
  const parsed = createEmployeeSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    postId: formData.get("postId"),
    joiningDate: formData.get("joiningDate"),
    accountNo: formData.get("accountNo"),
    ifscCode: formData.get("ifscCode"),
    monthlySalary: formData.get("monthlySalary"),
    workshopId: formData.get("workshopId"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const {
    fullName,
    email,
    password,
    phone,
    address,
    postId,
    joiningDate,
    accountNo,
    ifscCode,
    monthlySalary,
    workshopId,
  } = parsed.data;

  // Securely query settings from DB using me.company_id
  const { data: companySettings } = await supabase
    .from("companies")
    .select("daily_work_hours, working_days_per_month")
    .eq("id", me.company_id)
    .single();

  const dailyWorkHours = companySettings?.daily_work_hours ?? 8;
  const workingDaysPerMonth = companySettings?.working_days_per_month ?? 26;
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
    address: address || null,
    post_id: postId || null,
    joining_date: joiningDate || null,
    account_no: accountNo || null,
    ifsc_code: ifscCode || null,
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

  revalidateEmployeePages(createdAuth.user.id);
  return { success: true };
});

export const updateEmployee = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "update_employee", entityType: "employee" },
})(async (formData, { supabase, me }) => {
  const employeeId = String(formData.get("employeeId") || "");
  if (!employeeId) return { success: false, error: "Employee ID missing" };

  const parsed = updateEmployeeSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    postId: formData.get("postId"),
    joiningDate: formData.get("joiningDate"),
    accountNo: formData.get("accountNo"),
    ifscCode: formData.get("ifscCode"),
    monthlySalary: formData.get("monthlySalary"),
    workshopId: formData.get("workshopId"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const {
    fullName,
    phone,
    address,
    postId,
    joiningDate,
    accountNo,
    ifscCode,
    monthlySalary,
    workshopId,
  } = parsed.data;

  // Securely query settings from DB using me.company_id
  const { data: companySettings } = await supabase
    .from("companies")
    .select("daily_work_hours, working_days_per_month")
    .eq("id", me.company_id)
    .single();

  const dailyWorkHours = companySettings?.daily_work_hours ?? 8;
  const workingDaysPerMonth = companySettings?.working_days_per_month ?? 26;
  const hourlyRate = calcHourlyRate(monthlySalary, dailyWorkHours, workingDaysPerMonth);

  const { error } = await supabase
    .from("users")
    .update({
      full_name: fullName,
      phone: phone || null,
      address: address || null,
      post_id: postId || null,
      joining_date: joiningDate || null,
      account_no: accountNo || null,
      ifsc_code: ifscCode || null,
      monthly_salary: monthlySalary,
      hourly_rate: hourlyRate,
      daily_shift_hours: dailyWorkHours,
      workshop_id: workshopId || null,
    } as unknown as never)
    .eq("id", employeeId);

  if (error) return { success: false, error: error.message };

  revalidateEmployeePages(employeeId);
  return { success: true };
});

export const toggleEmployeeStatus = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "toggle_employee_status", entityType: "employee" },
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
  audit: { action: "delete_employee", entityType: "employee" },
})(async (formData) => {
  const admin = createAdminClient();
  const employeeId = String(formData.get("employeeId") || "");
  if (!employeeId) return { success: false, error: "Employee ID missing" };

  // 1. Soft delete the employee profile
  const { error: profileError } = await admin
    .from("users")
    .update({
      deleted_at: new Date().toISOString(),
      is_active: false,
    } as any)
    .eq("id", employeeId);

  if (profileError) return { success: false, error: profileError.message };

  // 2. Ban the auth user to deactivate login (10 years)
  const { error: authError } = await admin.auth.admin.updateUserById(employeeId, {
    ban_duration: "87600h",
  });
  if (authError) {
    // If auth ban fails, log it but don't fail the whole action if profile is soft deleted
    console.warn("Failed to ban auth user:", authError.message);
  }

  revalidatePath("/dashboard/employees");
  return { success: true };
});
