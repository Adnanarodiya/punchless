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

export async function createJob(formData: FormData): Promise<void> {
  const { supabase, me } = await getMe();

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const customerName = String(formData.get("customerName") || "").trim();
  const customerPhone = String(formData.get("customerPhone") || "").trim();
  const assignedTo = String(formData.get("assignedTo") || "") || null;
  const lat = Number(formData.get("lat") || 0);
  const lng = Number(formData.get("lng") || 0);
  const radius = Number(formData.get("radius") || 50);

  if (!title) throw new Error("Job title is required");

  // If assignedTo is provided, status is 'assigned', else 'pending'
  const status = assignedTo ? "assigned" : "pending";

  const { error } = await supabase.from("jobs").insert({
    company_id: me.company_id,
    title,
    description: description || null,
    customer_name: customerName || null,
    customer_phone: customerPhone || null,
    assigned_to: assignedTo,
    lat,
    lng,
    radius,
    status,
  } as unknown as never);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/jobs");
}

export async function updateJob(formData: FormData): Promise<void> {
  const { supabase } = await getMe();

  const jobId = String(formData.get("jobId") || "");
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const customerName = String(formData.get("customerName") || "").trim();
  const customerPhone = String(formData.get("customerPhone") || "").trim();
  const assignedTo = String(formData.get("assignedTo") || "") || null;
  const lat = Number(formData.get("lat") || 0);
  const lng = Number(formData.get("lng") || 0);
  const radius = Number(formData.get("radius") || 50);
  const status = String(formData.get("status") || "pending");

  if (!jobId || !title) throw new Error("Job ID and title required");

  const { error } = await supabase
    .from("jobs")
    .update({
      title,
      description: description || null,
      customer_name: customerName || null,
      customer_phone: customerPhone || null,
      assigned_to: assignedTo,
      lat,
      lng,
      radius,
      status,
    } as unknown as never)
    .eq("id", jobId);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/jobs");
}

export async function deleteJob(formData: FormData): Promise<void> {
  const { supabase } = await getMe();

  const jobId = String(formData.get("jobId") || "");
  if (!jobId) throw new Error("Job ID required");

  const { error } = await supabase.from("jobs").delete().eq("id", jobId);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/jobs");
}
