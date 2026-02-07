import { createClient } from "@/lib/supabase/server";
import type { Database } from "@punchless/types/database.types";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

export async function getEmployees(): Promise<UserRow[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("role", "employee")
    .order("created_at", { ascending: false });

  return (data as UserRow[]) ?? [];
}
