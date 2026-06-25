"use server";

import { revalidatePath } from "next/cache";
import { protectedAction } from "@/lib/server/protected-action";
import { stickyNoteSchema } from "@/lib/validations/sticky-note.schema";

function revalidateStickyNotes() {
  revalidatePath("/dashboard");
}

export const createStickyNote = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "create_sticky_note", entityType: "sticky_note" },
})(async (formData, { supabase, me }) => {
  const parsed = stickyNoteSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    noteDate: formData.get("noteDate"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const { title, description, noteDate } = parsed.data;

  const { error } = await supabase.from("sticky_notes").insert({
    company_id: me.company_id,
    title,
    description: description || null,
    note_date: noteDate,
    created_by: me.id,
  } as never);

  if (error) return { success: false, error: error.message };

  revalidateStickyNotes();
  return { success: true };
});

export const updateStickyNote = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "update_sticky_note", entityType: "sticky_note" },
})(async (formData, { supabase }) => {
  const noteId = String(formData.get("noteId") || "");
  if (!noteId) return { success: false, error: "Note ID required" };

  const parsed = stickyNoteSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    noteDate: formData.get("noteDate"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const { title, description, noteDate } = parsed.data;

  const { error } = await supabase
    .from("sticky_notes")
    .update({
      title,
      description: description || null,
      note_date: noteDate,
    } as never)
    .eq("id", noteId);

  if (error) return { success: false, error: error.message };

  revalidateStickyNotes();
  return { success: true };
});

export const deleteStickyNote = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "delete_sticky_note", entityType: "sticky_note" },
})(async (formData, { supabase }) => {
  const noteId = String(formData.get("noteId") || "");
  if (!noteId) return { success: false, error: "Note ID required" };

  const { error } = await supabase.from("sticky_notes").delete().eq("id", noteId);

  if (error) return { success: false, error: error.message };

  revalidateStickyNotes();
  return { success: true };
});