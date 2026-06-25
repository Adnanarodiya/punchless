"use server";

import { revalidatePath } from "next/cache";
import { protectedAction } from "@/lib/server/protected-action";
import { sendPushToUser } from "@/lib/server/push-notifications";
import { createAdvanceSchema } from "@/lib/validations/advance.schema";

function revalidateAdvancePages() {
  revalidatePath("/dashboard/advances");
  revalidatePath("/dashboard/salary");
  revalidatePath("/dashboard");
}

export const createAdvance = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "create_advance", entityType: "advance" },
})(async (formData, { supabase, me }) => {
  const parsed = createAdvanceSchema.safeParse({
    employeeId: formData.get("employeeId"),
    amount: formData.get("amount"),
    reason: formData.get("reason"),
    salaryMonth: formData.get("salaryMonth"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const { employeeId, amount, reason, salaryMonth } = parsed.data;

  const { error } = await supabase.from("salary_advances").insert({
    company_id: me.company_id,
    employee_id: employeeId,
    amount,
    reason: reason || null,
    salary_month: salaryMonth || null,
    status: "pending",
  } as unknown as never);

  if (error) return { success: false, error: error.message };

  revalidateAdvancePages();
  return { success: true };
});

export const approveAdvance = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "approve_advance", entityType: "advance" },
})(async (formData, { supabase, me }) => {
  const advanceId = String(formData.get("advanceId") || "");
  const notes = String(formData.get("notes") || "") || null;

  if (!advanceId) return { success: false, error: "Advance ID required" };

  const { data: advance } = await supabase
    .from("salary_advances")
    .select("employee_id, amount")
    .eq("id", advanceId)
    .single();

  const { error } = await supabase
    .from("salary_advances")
    .update({
      status: "approved",
      approved_by: me.id,
      approved_at: new Date().toISOString(),
      notes,
    } as unknown as never)
    .eq("id", advanceId);

  if (error) return { success: false, error: error.message };

  if (advance?.employee_id) {
    void sendPushToUser(advance.employee_id, {
      title: "Advance approved",
      body: `Your advance of ₹${advance.amount} has been approved`,
      data: { type: "advance_approved", screen: "salary" },
    });
  }

  revalidateAdvancePages();
  return { success: true };
});

export const rejectAdvance = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "reject_advance", entityType: "advance" },
})(async (formData, { supabase, me }) => {
  const advanceId = String(formData.get("advanceId") || "");
  const notes = String(formData.get("notes") || "") || null;

  if (!advanceId) return { success: false, error: "Advance ID required" };

  const { data: advance } = await supabase
    .from("salary_advances")
    .select("employee_id, amount")
    .eq("id", advanceId)
    .single();

  const { error } = await supabase
    .from("salary_advances")
    .update({
      status: "rejected",
      approved_by: me.id,
      approved_at: new Date().toISOString(),
      notes,
    } as unknown as never)
    .eq("id", advanceId);

  if (error) return { success: false, error: error.message };

  if (advance?.employee_id) {
    void sendPushToUser(advance.employee_id, {
      title: "Advance rejected",
      body: `Your advance request of ₹${advance.amount} was rejected`,
      data: { type: "advance_rejected", screen: "salary" },
    });
  }

  revalidateAdvancePages();
  return { success: true };
});

export const deleteAdvance = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "delete_advance", entityType: "advance" },
})(async (formData, { supabase }) => {
  const advanceId = String(formData.get("advanceId") || "");
  if (!advanceId) return { success: false, error: "Advance ID required" };

  const { error } = await supabase
    .from("salary_advances")
    .delete()
    .eq("id", advanceId);

  if (error) return { success: false, error: error.message };

  revalidateAdvancePages();
  return { success: true };
});
