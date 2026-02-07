"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@punchless/types/database.types";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

export async function createEmployee(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    throw new Error("Unauthorized");
  }

  const { data: meData } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  const me = meData as UserRow | null;

  if (!me || !["owner", "admin"].includes(me.role)) {
    throw new Error("Only owner/admin can create employees");
  }

  const fullName = String(formData.get("fullName") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "").trim();
  const hourlyRate = Number(formData.get("hourlyRate") || 0);
  const travelRate = Number(formData.get("travelRate") || 0);

  if (!fullName || !email || password.length < 6) {
    throw new Error("Full name, email and password (min 6) are required");
  }

  const { data: createdAuth, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: "employee",
    },
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
    hourly_rate: hourlyRate,
    travel_rate: travelRate,
    is_active: true,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(createdAuth.user.id);
    throw new Error(profileError.message);
  }

  revalidatePath("/dashboard/employees");
}
