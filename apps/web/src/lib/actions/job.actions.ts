"use server";

import { revalidatePath } from "next/cache";
import { protectedAction } from "@/lib/server/protected-action";
import { jobSchema } from "@/lib/validations/job.schema";

export const createJob = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "create_job", entityType: "job" },
})(async (formData, { supabase, me }) => {
  const parsed = jobSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    customerName: formData.get("customerName"),
    customerPhone: formData.get("customerPhone"),
    assignedTo: formData.get("assignedTo"),
    lat: formData.get("lat"),
    lng: formData.get("lng"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const { title, description, customerName, customerPhone, assignedTo, lat, lng } = parsed.data;

  const { error } = await supabase.from("jobs").insert({
    company_id: me.company_id,
    title,
    description: description || null,
    customer_name: customerName || null,
    customer_phone: customerPhone || null,
    assigned_to: assignedTo || null,
    lat: lat || null,
    lng: lng || null,
    status: assignedTo ? "assigned" : "pending",
  } as unknown as never);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/jobs");
  return { success: true };
});

export const updateJob = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "update_job", entityType: "job" },
})(async (formData, { supabase }) => {
  const jobId = String(formData.get("jobId") || "");
  if (!jobId) return { success: false, error: "Job ID missing" };

  const parsed = jobSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    customerName: formData.get("customerName"),
    customerPhone: formData.get("customerPhone"),
    assignedTo: formData.get("assignedTo"),
    status: formData.get("status"),
    lat: formData.get("lat"),
    lng: formData.get("lng"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const { title, description, customerName, customerPhone, assignedTo, status, lat, lng } = parsed.data;

  const { error } = await supabase
    .from("jobs")
    .update({
      title,
      description: description || null,
      customer_name: customerName || null,
      customer_phone: customerPhone || null,
      assigned_to: assignedTo || null,
      status: status || "pending",
      lat: lat || null,
      lng: lng || null,
    } as unknown as never)
    .eq("id", jobId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/jobs");
  return { success: true };
});

export const deleteJob = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "delete_job", entityType: "job" },
})(async (formData, { supabase }) => {
  const jobId = String(formData.get("jobId") || "");
  if (!jobId) return { success: false, error: "Job ID missing" };

  const { error } = await supabase
    .from("jobs")
    .update({ deleted_at: new Date().toISOString() } as unknown as never)
    .eq("id", jobId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/jobs");
  return { success: true };
});
