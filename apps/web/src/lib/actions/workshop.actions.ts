"use server";

import { revalidatePath } from "next/cache";
import { protectedAction } from "@/lib/server/protected-action";
import { workshopSchema } from "@/lib/validations/workshop.schema";

export const createWorkshop = protectedAction<FormData>({
  roles: ["owner", "admin"],
})(async (formData, { supabase, me }) => {
  const parsed = workshopSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
    lat: formData.get("lat"),
    lng: formData.get("lng"),
    radius: formData.get("radius"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const { name, address, lat, lng, radius } = parsed.data;

  const { error } = await supabase.from("workshops").insert({
    company_id: me.company_id,
    name,
    address: address || null,
    lat,
    lng,
    radius,
  } as unknown as never);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/workshops");
  return { success: true };
});

export const updateWorkshop = protectedAction<FormData>({
  roles: ["owner", "admin"],
})(async (formData, { supabase }) => {
  const workshopId = String(formData.get("workshopId") || "");
  if (!workshopId) return { success: false, error: "Workshop ID missing" };

  const parsed = workshopSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
    lat: formData.get("lat"),
    lng: formData.get("lng"),
    radius: formData.get("radius"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const { name, address, lat, lng, radius } = parsed.data;

  const { error } = await supabase
    .from("workshops")
    .update({ name, address: address || null, lat, lng, radius } as unknown as never)
    .eq("id", workshopId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/workshops");
  return { success: true };
});

export const toggleWorkshopStatus = protectedAction<FormData>({
  roles: ["owner", "admin"],
})(async (formData, { supabase }) => {
  const workshopId = String(formData.get("workshopId") || "");
  const nextStatus = String(formData.get("nextStatus") || "false") === "true";

  if (!workshopId) return { success: false, error: "Workshop ID missing" };

  const { error } = await supabase
    .from("workshops")
    .update({ is_active: nextStatus } as unknown as never)
    .eq("id", workshopId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/workshops");
  return { success: true };
});

export const deleteWorkshop = protectedAction<FormData>({
  roles: ["owner", "admin"],
})(async (formData, { supabase }) => {
  const workshopId = String(formData.get("workshopId") || "");
  if (!workshopId) return { success: false, error: "Workshop ID missing" };

  const { error } = await supabase
    .from("workshops")
    .update({ deleted_at: new Date().toISOString() } as unknown as never)
    .eq("id", workshopId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/workshops");
  return { success: true };
});
