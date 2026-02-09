"use server";

import { revalidatePath } from "next/cache";
import { protectedAction } from "@/lib/server/protected-action";
import { companySettingsSchema } from "@/lib/validations/settings.schema";

export const updateCompanySettings = protectedAction<FormData>({
  roles: ["owner"],
})(async (formData, { supabase, me }) => {
  const parsed = companySettingsSchema.safeParse({
    workStartTime: formData.get("workStartTime"),
    gracePeriodMinutes: formData.get("gracePeriodMinutes"),
    dailyWorkHours: formData.get("dailyWorkHours"),
    workingDaysPerMonth: formData.get("workingDaysPerMonth"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const { workStartTime, gracePeriodMinutes, dailyWorkHours, workingDaysPerMonth } = parsed.data;

  const { error } = await supabase
    .from("companies")
    .update({
      work_start_time: workStartTime,
      grace_period_minutes: gracePeriodMinutes,
      daily_work_hours: dailyWorkHours,
      working_days_per_month: workingDaysPerMonth,
    } as unknown as never)
    .eq("id", me.company_id);

  if (error) return { success: false, error: error.message };

  // Recalculate hourly_rate for all employees
  const totalMonthlyHours = dailyWorkHours * workingDaysPerMonth;

  if (totalMonthlyHours > 0) {
    const { data: employees } = await supabase
      .from("users")
      .select("id, monthly_salary")
      .eq("company_id", me.company_id)
      .eq("role", "employee");

    if (employees) {
      type EmpRow = { id: string; monthly_salary: number | null };
      for (const raw of employees) {
        const emp = raw as unknown as EmpRow;
        const monthlySalary = emp.monthly_salary ?? 0;
        if (monthlySalary > 0) {
          const newHourlyRate = Math.round((monthlySalary / totalMonthlyHours) * 100) / 100;
          await supabase
            .from("users")
            .update({
              hourly_rate: newHourlyRate,
            } as unknown as never)
            .eq("id", emp.id);
        }
      }
    }
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/employees");
  revalidatePath("/dashboard/salary");
  return { success: true };
});
