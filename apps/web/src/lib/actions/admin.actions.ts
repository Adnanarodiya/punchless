"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { protectedAction } from "@/lib/server/protected-action";
import {
  changePasswordSchema,
  inviteAdminSchema,
} from "@/lib/validations/admin.schema";

function revalidateAdminPages() {
  revalidatePath("/dashboard/settings/users");
  revalidatePath("/dashboard/audit-log");
}

export const inviteAdminUser = protectedAction<FormData>({
  roles: ["owner"],
  audit: { action: "invite_admin", entityType: "user" },
})(async (formData, { me }) => {
  const parsed = inviteAdminSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const { fullName, email, password, phone } = parsed.data;
  const admin = createAdminClient();

  const { data: createdAuth, error: authError } = await admin.auth.admin.createUser({
    email: email.toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: "admin" },
  });

  if (authError || !createdAuth.user) {
    return { success: false, error: authError?.message || "Failed to create admin user" };
  }

  const { error: profileError } = await admin.from("users").insert({
    id: createdAuth.user.id,
    company_id: me.company_id,
    role: "admin",
    full_name: fullName,
    email: email.toLowerCase(),
    phone: phone || null,
    is_active: true,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(createdAuth.user.id);
    return { success: false, error: profileError.message };
  }

  await admin.auth.admin.updateUserById(createdAuth.user.id, {
    app_metadata: { company_id: me.company_id, role: "admin" },
  });

  revalidateAdminPages();
  return { success: true };
});

export const deactivateAdminUser = protectedAction<FormData>({
  roles: ["owner"],
  audit: { action: "deactivate_admin", entityType: "user" },
})(async (formData, { supabase, me }) => {
  const adminUserId = String(formData.get("adminUserId") || "");
  if (!adminUserId) return { success: false, error: "User ID required" };
  if (adminUserId === me.id) {
    return { success: false, error: "You cannot deactivate your own account." };
  }

  const { data: target } = await supabase
    .from("users")
    .select("role")
    .eq("id", adminUserId)
    .single();

  const targetRole = (target as { role: string } | null)?.role;
  if (!targetRole || targetRole === "owner") {
    return { success: false, error: "Cannot deactivate the owner account." };
  }

  const admin = createAdminClient();

  const { error: profileError } = await admin
    .from("users")
    .update({
      is_active: false,
      deleted_at: new Date().toISOString(),
    } as never)
    .eq("id", adminUserId);

  if (profileError) return { success: false, error: profileError.message };

  await admin.auth.admin.updateUserById(adminUserId, { ban_duration: "87600h" });

  revalidateAdminPages();
  return { success: true };
});

export const changePassword = protectedAction<FormData>({
  roles: ["owner", "admin", "employee"],
  audit: {
    action: "change_password",
    entityType: "user",
    entityId: (_input, me) => me.id,
    summary: (_input, me) => `Password changed for ${me.full_name}`,
  },
})(async (formData, { me }) => {
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const { currentPassword, newPassword } = parsed.data;
  const supabase = await createClient();

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: me.email,
    password: currentPassword,
  });

  if (signInError) {
    return { success: false, error: "Current password is incorrect." };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true };
});