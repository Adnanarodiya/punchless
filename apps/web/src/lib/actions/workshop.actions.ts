"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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

export async function createWorkshop(formData: FormData): Promise<void> {
  const { supabase, me } = await getMe();

  const name = String(formData.get("name") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const lat = Number(formData.get("lat") || 0);
  const lng = Number(formData.get("lng") || 0);
  const radius = Number(formData.get("radius") || 100);

  if (!name) throw new Error("Workshop name is required");

  const { error } = await supabase
    .from("workshops")
    .insert({
      company_id: me.company_id,
      name,
      address: address || null,
      lat,
      lng,
      radius,
      is_active: true,
    } as unknown as never);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/workshops");
}

export async function updateWorkshop(formData: FormData): Promise<void> {
  const { supabase } = await getMe();

  const workshopId = String(formData.get("workshopId") || "");
  const name = String(formData.get("name") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const lat = Number(formData.get("lat") || 0);
  const lng = Number(formData.get("lng") || 0);
  const radius = Number(formData.get("radius") || 100);

  if (!workshopId || !name) throw new Error("Workshop ID and name required");

  const { error } = await supabase
    .from("workshops")
    .update({ name, address: address || null, lat, lng, radius } as unknown as never)
    .eq("id", workshopId);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/workshops");
}

export async function toggleWorkshopStatus(formData: FormData): Promise<void> {
  const { supabase } = await getMe();

  const workshopId = String(formData.get("workshopId") || "");
  const nextStatus = String(formData.get("nextStatus") || "false") === "true";

  if (!workshopId) throw new Error("Workshop ID missing");

  const { error } = await supabase
    .from("workshops")
    .update({ is_active: nextStatus } as unknown as never)
    .eq("id", workshopId);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/workshops");
}

export async function deleteWorkshop(formData: FormData): Promise<void> {
  const { supabase } = await getMe();

  const workshopId = String(formData.get("workshopId") || "");
  if (!workshopId) throw new Error("Workshop ID missing");

  const { error } = await supabase
    .from("workshops")
    .delete()
    .eq("id", workshopId);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/workshops");
}
