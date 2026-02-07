import { createClient } from "@/lib/supabase/server";
import type { Database } from "@punchless/types/database.types";

type WorkshopRow = Database["public"]["Tables"]["workshops"]["Row"];

export async function getWorkshops(): Promise<WorkshopRow[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("workshops")
    .select("*")
    .order("created_at", { ascending: false });

  return (data as WorkshopRow[]) ?? [];
}
