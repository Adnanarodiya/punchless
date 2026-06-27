"use server";

import { revalidatePath } from "next/cache";
import { protectedAction } from "@/lib/server/protected-action";
import {
  companyProfileSchema,
  companySettingsSchema,
} from "@/lib/validations/settings.schema";
import {
  dataLockPinSchema,
  verifyDataLockPinSchema,
} from "@/lib/validations/sticky-note.schema";
import {
  hashDataLockPin,
  verifyDataLockPin,
} from "@/lib/utils/pin-hash";

export const updateCompanySettings = protectedAction<FormData>({
  roles: ["owner"],
  audit: { action: "update_company_settings", entityType: "settings" },
})(async (formData, { supabase, me }) => {
  const parsed = companySettingsSchema.safeParse({
    salaryMode: formData.get("salaryMode"),
    workStartTime: formData.get("workStartTime"),
    gracePeriodMinutes: formData.get("gracePeriodMinutes"),
    dailyWorkHours: formData.get("dailyWorkHours"),
    workingDaysPerMonth: formData.get("workingDaysPerMonth"),
    otRateMultiplier: formData.get("otRateMultiplier"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const {
    salaryMode,
    workStartTime,
    gracePeriodMinutes,
    dailyWorkHours,
    workingDaysPerMonth,
    otRateMultiplier,
  } = parsed.data;

  const { error } = await supabase
    .from("companies")
    .update({
      salary_mode: salaryMode,
      work_start_time: workStartTime,
      grace_period_minutes: gracePeriodMinutes,
      daily_work_hours: dailyWorkHours,
      working_days_per_month: workingDaysPerMonth,
      ot_rate_multiplier: otRateMultiplier,
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

export const updateCompanyProfile = protectedAction<FormData>({
  roles: ["owner"],
  audit: { action: "update_company_profile", entityType: "settings" },
})(async (formData, { supabase, me }) => {
  const parsed = companyProfileSchema.safeParse({
    tagline: formData.get("tagline"),
    address: formData.get("address"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    logoUrl: formData.get("logoUrl"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const { tagline, address, phone, email, logoUrl } = parsed.data;

  const { error } = await supabase
    .from("companies")
    .update({
      tagline,
      address,
      phone,
      email,
      logo_url: logoUrl,
    } as unknown as never)
    .eq("id", me.company_id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard/suppliers");
  return { success: true };
});

export const setDataLockPin = protectedAction<FormData>({
  roles: ["owner"],
  audit: { action: "set_data_lock_pin", entityType: "settings" },
})(async (formData, { supabase, me }) => {
  const parsed = dataLockPinSchema.safeParse({
    pin: String(formData.get("pin") || "").trim(),
    confirmPin: String(formData.get("confirmPin") || "").trim(),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const { error } = await supabase
    .from("companies")
    .update({ data_lock_pin_hash: hashDataLockPin(parsed.data.pin) } as never)
    .eq("id", me.company_id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { success: true };
});

export const removeDataLockPin = protectedAction<FormData>({
  roles: ["owner"],
  audit: { action: "remove_data_lock_pin", entityType: "settings" },
})(async (_formData, { supabase, me }) => {
  const { error } = await supabase
    .from("companies")
    .update({ data_lock_pin_hash: null } as never)
    .eq("id", me.company_id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { success: true };
});

export const verifyDataLockPinAction = protectedAction<FormData>({
  roles: ["owner", "admin"],
})(async (formData, { supabase, me }) => {
  const parsed = verifyDataLockPinSchema.safeParse({
    pin: String(formData.get("pin") || "").trim(),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const { data } = await supabase
    .from("companies")
    .select("data_lock_pin_hash")
    .eq("id", me.company_id)
    .single();

  const hash = (data as { data_lock_pin_hash: string | null } | null)
    ?.data_lock_pin_hash;

  if (!hash) {
    return { success: false, error: "Data lock PIN is not configured." };
  }

  if (!verifyDataLockPin(parsed.data.pin, hash)) {
    return { success: false, error: "Incorrect PIN." };
  }

  return { success: true };
});
