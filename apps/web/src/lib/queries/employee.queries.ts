import { createClient } from "@/lib/supabase/server";
import type { Database } from "@punchless/types/database.types";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

export type EmployeeWithWorkshop = UserRow & {
  workshop_name: string | null;
};

export async function getEmployees(): Promise<EmployeeWithWorkshop[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("users")
    .select("*, workshops(name)")
    .eq("role", "employee")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  // Flatten the join
  const employees = ((data as unknown as Array<UserRow & { workshops: { name: string } | null }>) ?? []).map((emp) => ({
    ...emp,
    workshop_name: emp.workshops?.name ?? null,
  }));

  return employees;
}
