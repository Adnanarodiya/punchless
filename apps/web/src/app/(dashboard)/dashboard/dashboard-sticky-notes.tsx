"use client";

import { useState } from "react";
import { Pencil, Plus, StickyNote, Trash2 } from "lucide-react";

import { Button } from "@punchless/ui/components/button";
import { ConfirmModal } from "@punchless/ui/components/confirm-modal";
import { Modal } from "@punchless/ui/components/modal";

import {
  createStickyNote,
  deleteStickyNote,
  updateStickyNote,
} from "@/lib/actions/sticky-note.actions";
import type { StickyNoteRow } from "@/lib/queries/sticky-note.queries";
import { useAction } from "@/hooks/use-action";

interface Props {
  notes: StickyNoteRow[];
}

type FormMode = { type: "create" } | { type: "edit"; note: StickyNoteRow };

const inputClass =
  "w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground text-sm";

export function DashboardStickyNotes({ notes }: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>({ type: "create" });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const closeForm = () => {
    setFormOpen(false);
    setFormMode({ type: "create" });
  };

  const { execute: handleCreate, loading: creating } = useAction(createStickyNote, {
    successMessage: "Note added",
    onSuccess: closeForm,
  });

  const { execute: handleUpdate, loading: updating } = useAction(updateStickyNote, {
    successMessage: "Note updated",
    onSuccess: closeForm,
  });

  const { execute: handleDelete, loading: deleting } = useAction(deleteStickyNote, {
    successMessage: "Note deleted",
    onSuccess: () => setDeleteId(null),
  });

  const saving = creating || updating;
  const today = new Date().toISOString().slice(0, 10);

  function openCreate() {
    setFormMode({ type: "create" });
    setFormOpen(true);
  }

  function openEdit(note: StickyNoteRow) {
    setFormMode({ type: "edit", note });
    setFormOpen(true);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (formMode.type === "edit") {
      formData.set("noteId", formMode.note.id);
      await handleUpdate(formData);
    } else {
      await handleCreate(formData);
    }
  }

  return (
    <section
      aria-labelledby="sticky-notes-heading"
      className="rounded-xl border border-border bg-card p-5"
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <StickyNote className="size-5 text-warning" />
          <h2 id="sticky-notes-heading" className="text-lg font-semibold">
            Sticky notes
          </h2>
        </div>
        <Button type="button" size="sm" onClick={openCreate}>
          <Plus className="size-4" />
          Add note
        </Button>
      </div>

      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No reminders yet. Add a note for daily follow-ups.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <li
              key={note.id}
              className="rounded-lg border border-warning/20 bg-warning/5 p-4"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{note.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {note.note_date
                      ? new Date(note.note_date).toLocaleDateString("en-IN")
                      : "—"}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => openEdit(note)}
                    aria-label="Edit note"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive"
                    onClick={() => setDeleteId(note.id)}
                    aria-label="Delete note"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
              {note.description ? (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {note.description}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={formOpen}
        onOpenChange={(open) => !open && closeForm()}
        title={formMode.type === "edit" ? "Edit note" : "Add note"}
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Title</label>
            <input
              name="title"
              required
              maxLength={120}
              defaultValue={formMode.type === "edit" ? formMode.note.title : ""}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Date</label>
            <input
              name="noteDate"
              type="date"
              required
              defaultValue={
                formMode.type === "edit"
                  ? formMode.note.note_date ?? today
                  : today
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              maxLength={2000}
              defaultValue={
                formMode.type === "edit" ? formMode.note.description ?? "" : ""
              }
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <Button type="submit" className="w-full" loading={saving} disabled={saving}>
            {formMode.type === "edit" ? "Update" : "Add note"}
          </Button>
        </form>
      </Modal>

      <ConfirmModal
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete note?"
        description="This reminder will be removed permanently."
        variant="destructive"
        onConfirm={async () => {
          if (!deleteId || deleting) return;
          const fd = new FormData();
          fd.set("noteId", deleteId);
          await handleDelete(fd);
        }}
      />
    </section>
  );
}