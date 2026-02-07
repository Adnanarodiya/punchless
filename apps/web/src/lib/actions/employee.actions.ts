"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@punchless/types/database.types";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

async function getMe() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data } = await supabase.from("users").select("*").eq("id", user.id).single();
  const me = data as UserRow | null;
  if (!me || !["owner", "admin"].includes(me.role)) throw new Error("Only owner/admin allowed");
  return { supabase, me };
}

// ============================================
// CREATE EMPLOYEE
// ============================================
export async function createEmployee(formData: FormData): Promise<void> {
  const { me } = await getMe();
  const admin = createAdminClient();

  const fullName = String(formData.get("fullName") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const hourlyRate = Number(formData.get("hourlyRate") || 0);
  const travelRate = Number(formData.get("travelRate") || 0);
  const dailyShiftHours = Number(formData.get("dailyShiftHours") || 8);
  const workshopId = String(formData.get("workshopId") || "").trim() || null;

  if (!fullName || !email || password.length < 6) {
    throw new Error("Full name, email and password (min 6) are required");
  }

  const { data: createdAuth, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: "employee" },
  });

  if (authError || !createdAuth.user) {
    throw new Error(authError?.message || "Failed to create auth user");
  }

  const { error: profileError } = await admin.from("users").insert({
    id: createdAuth.user.id,
    company_id: me.company_id,
    role: "employee",
    full_name: fullName,
    email,
    phone: phone || null,
    hourly_rate: hourlyRate,
    travel_rate: travelRate,
    daily_shift_hours: dailyShiftHours,
    workshop_id: workshopId,
    is_active: true,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(createdAuth.user.id);
    throw new Error(profileError.message);
  }

  revalidatePath("/dashboard/employees");
}

// ============================================
// UPDATE EMPLOYEE (name, phone, rates, shift hours)
// ============================================
export async function updateEmployee(formData: FormData): Promise<void> {
  const { supabase } = await getMe();

  const employeeId = String(formData.get("employeeId") || "");
  const fullName = String(formData.get("fullName") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const hourlyRate = Number(formData.get("hourlyRate") || 0);
  const travelRate = Number(formData.get("travelRate") || 0);
  const dailyShiftHours = Number(formData.get("dailyShiftHours") || 8);
  const workshopId = String(formData.get("workshopId") || "").trim() || null;

  if (!employeeId || !fullName) throw new Error("Employee ID and name required");

  const { error } = await supabase
    .from("users")
    .update({
      full_name: fullName,
      phone: phone || null,
      hourly_rate: hourlyRate,
      travel_rate: travelRate,
      daily_shift_hours: dailyShiftHours,
      workshop_id: workshopId,
    } as unknown as never)
    .eq("id", employeeId);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/employees");
}

// ============================================
// TOGGLE EMPLOYEE ACTIVE STATUS
// ============================================
export async function toggleEmployeeStatus(formData: FormData): Promise<void> {
  const { supabase } = await getMe();

  const employeeId = String(formData.get("employeeId") || "");
  const nextStatus = String(formData.get("nextStatus") || "false") === "true";

  if (!employeeId) throw new Error("Employee ID missing");

  const { error } = await supabase
    .from("users")
    .update({ is_active: nextStatus } as unknown as never)
    .eq("id", employeeId);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/employees");
}

// ============================================
// DELETE EMPLOYEE (removes auth user + profile)
// ============================================
export async function deleteEmployee(formData: FormData): Promise<void> {
  await getMe();
  const admin = createAdminClient();

  const employeeId = String(formData.get("employeeId") || "");
  if (!employeeId) throw new Error("Employee ID missing");

  // Delete auth user (cascade will delete profile via FK)
  const { error } = await admin.auth.admin.deleteUser(employeeId);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/employees");
}
