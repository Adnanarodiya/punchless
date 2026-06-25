import { createClient } from "@/lib/supabase/server";
import type { Database } from "@punchless/types/database.types";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

export type EmployeeWithWorkshop = UserRow & {
  workshop_name: string | null;
  post_name: string | null;
};

function mapEmployeeRow(
  emp: UserRow & {
    workshops: { name: string } | null;
    posts: { name: string } | null;
  }
): EmployeeWithWorkshop {
  return {
    ...emp,
    workshop_name: emp.workshops?.name ?? null,
    post_name: emp.posts?.name ?? null,
  };
}

export async function getEmployees(): Promise<EmployeeWithWorkshop[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("users")
    .select("*, workshops(name), posts(name)")
    .eq("role", "employee")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    (data as unknown as Array<
      UserRow & {
        workshops: { name: string } | null;
        posts: { name: string } | null;
      }
    >) ?? []
  ).map(mapEmployeeRow);
}

export async function getEmployeeById(
  employeeId: string
): Promise<EmployeeWithWorkshop | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("users")
    .select("*, workshops(name), posts(name)")
    .eq("id", employeeId)
    .eq("role", "employee")
    .is("deleted_at", null)
    .single();

  if (!data) return null;
  return mapEmployeeRow(
    data as UserRow & {
      workshops: { name: string } | null;
      posts: { name: string } | null;
    }
  );
}
