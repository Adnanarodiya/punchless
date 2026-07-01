"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";

import { Button } from "@punchless/ui/components/button";
import { ConfirmModal } from "@punchless/ui/components/confirm-modal";
import { DeleteConfirmButton } from "@/components/delete-confirm-button";
import {
  EditClientStatementEntryModal,
  useClientStatementEntryDelete,
} from "@/components/edit-client-statement-entry-modal";
import {
  EditJournalEntryModal,
  useJournalEntryDelete,
} from "@/components/edit-journal-entry-modal";
import type { BankWithBalance } from "@/lib/queries/bank.queries";
import type { StatementLine } from "@/lib/utils/statement";
import { isJournalEditableEntity } from "@/lib/utils/statement";
import { formatCurrency } from "@/lib/utils/formatting";

type Props = {
  clientId: string;
  line: StatementLine;
  banks: BankWithBalance[];
  onSuccess?: () => void;
};

function entrySummary(line: StatementLine) {
  const amount = line.debit > 0 ? line.debit : line.credit;
  const kind =
    line.editable_entity === "client_payment"
      ? "payment"
      : line.editable_entity === "discount_settlement"
        ? "discount settlement"
        : line.editable_entity === "credit_note"
          ? "credit note"
          : line.editable_entity === "debit_note"
            ? "debit note"
            : line.invoice_number
              ? `bill ${line.invoice_number}`
              : "quick bill";
  const label = line.remark || line.invoice_number || kind;
  return `${label} — ${formatCurrency(amount)}`;
}

export function ClientStatementRowActions({ clientId, line, banks, onSuccess }: Props) {
  const [confirmEditOpen, setConfirmEditOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [journalEditOpen, setJournalEditOpen] = useState(false);
  const { deleteEntry, deleting } = useClientStatementEntryDelete(clientId, onSuccess);
  const { deleteEntry: deleteJournalEntry, deleting: deletingJournal } =
    useJournalEntryDelete(onSuccess);

  if (!line.editable_entity || !line.editable_id) {
    return <span className="text-muted-foreground">—</span>;
  }

  const isJournal = isJournalEditableEntity(line.editable_entity);
  const summary = entrySummary(line);
  const deletingAny = deleting || deletingJournal;

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        title="Edit entry"
        onClick={() => setConfirmEditOpen(true)}
      >
        <Pencil className="size-4" />
      </Button>

      <DeleteConfirmButton
        entityName={summary}
        entityType="entry"
        title="Delete entry"
        onConfirm={async () => {
          if (isJournal) {
            await deleteJournalEntry(line);
          } else {
            await deleteEntry(line);
          }
        }}
        loading={deletingAny}
      />

      <ConfirmModal
        open={confirmEditOpen}
        onOpenChange={setConfirmEditOpen}
        title="Edit this entry?"
        description={`Are you sure you want to edit "${summary}"? You can fix the amount, date, or remark.`}
        confirmText="Continue to edit"
        onConfirm={() => {
          setConfirmEditOpen(false);
          if (isJournal) {
            setJournalEditOpen(true);
          } else {
            setEditOpen(true);
          }
        }}
      />

      <EditClientStatementEntryModal
        open={editOpen}
        onOpenChange={setEditOpen}
        clientId={clientId}
        line={line}
        onSuccess={onSuccess}
      />

      <EditJournalEntryModal
        open={journalEditOpen}
        onOpenChange={setJournalEditOpen}
        line={line}
        banks={banks}
        onSuccess={onSuccess}
      />
    </>
  );
}