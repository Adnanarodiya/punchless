import { createClient } from "@/lib/supabase/server";
import type { Database } from "@punchless/types/database.types";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

export type DashboardUser = Pick<
  UserRow,
  "id" | "full_name" | "email" | "phone" | "role" | "is_active" | "created_at"
>;

export async function getDashboardUsers(): Promise<DashboardUser[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("users")
    .select("id, full_name, email, phone, role, is_active, created_at")
    .in("role", ["owner", "admin"])
    .is("deleted_at", null)
    .order("role", { ascending: true })
    .order("created_at", { ascending: true });

  return (data as DashboardUser[]) ?? [];
}