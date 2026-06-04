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

  // Recalculate hourly_rate for all active employees of the company using SQL RPC
  const { error: rpcError } = await supabase.rpc("recalculate_hourly_rates" as any, {
    p_company_id: me.company_id,
    p_daily_hours: dailyWorkHours,
    p_working_days: workingDaysPerMonth,
  });

  if (rpcError) {
    return { success: false, error: rpcError.message };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/employees");
  revalidatePath("/dashboard/salary");
  return { success: true };
});
