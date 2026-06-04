import { createClient } from "@/lib/supabase/server";
import type { Database } from "@punchless/types/database.types";

type UserRow = Database["public"]["Tables"]["users"]["Row"];
type CompanyRow = Database["public"]["Tables"]["companies"]["Row"];

export type CurrentUser = UserRow & {
  company: Pick<CompanyRow, "id" | "name" | "subscription_status"> | null;
};

// Get the currently logged-in auth user
export async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// Get the current user's profile from our users table (with company)
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  // Fetch user profile and company in a single select query, filtering soft-deleted profiles
  const { data, error } = await supabase
    .from("users")
    .select("*, company:companies(id, name, subscription_status)")
    .eq("id", authUser.id)
    .is("deleted_at", null)
    .single();

  if (error || !data) return null;

  return data as unknown as CurrentUser;
}

// Get the current user's company
export async function getCurrentCompany() {
  const user = await getCurrentUser();
  if (!user) return null;
  return user.company;
}
