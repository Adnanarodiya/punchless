import { createClient } from "@/lib/supabase/server";
import type { Database } from "@punchless/types/database.types";

export type StickyNoteRow = Database["public"]["Tables"]["sticky_notes"]["Row"];

export async function getStickyNotes(limit = 20): Promise<StickyNoteRow[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("sticky_notes")
    .select("*")
    .order("note_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data as StickyNoteRow[] | null) ?? [];
}