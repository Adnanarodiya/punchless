import { supabase } from "@/lib/supabase";
import type { Database } from "@punchless/types";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

export type MobileUser = UserRow;

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOutUser() {
  return supabase.auth.signOut();
}

export async function getSessionUserProfile(): Promise<MobileUser | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;
  return data as UserRow;
}
