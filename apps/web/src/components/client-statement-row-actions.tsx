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
import type { StatementLine } from "@/lib/utils/statement";
import { formatCurrency } from "@/lib/utils/formatting";

type Props = {
  clientId: string;
  line: StatementLine;
  onSuccess?: () => void;
};

function entrySummary(line: StatementLine) {
  const amount = line.debit > 0 ? line.debit : line.credit;
  const kind =
    line.editable_entity === "client_payment"
      ? "payment"
      : line.invoice_number
        ? `bill ${line.invoice_number}`
        : "quick bill";
  const label = line.remark || line.invoice_number || kind;
  return `${label} — ${formatCurrency(amount)}`;
}

export function ClientStatementRowActions({ clientId, line, onSuccess }: Props) {
  const [confirmEditOpen, setConfirmEditOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const { deleteEntry, deleting } = useClientStatementEntryDelete(clientId, onSuccess);

  if (!line.editable_entity || !line.editable_id) {
    return <span className="text-muted-foreground">—</span>;
  }

  const summary = entrySummary(line);

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
        onConfirm={async () => deleteEntry(line)}
        loading={deleting}
      />

      <ConfirmModal
        open={confirmEditOpen}
        onOpenChange={setConfirmEditOpen}
        title="Edit this entry?"
        description={`Are you sure you want to edit "${summary}"? You can fix the amount, date, or remark.`}
        confirmText="Continue to edit"
        onConfirm={() => {
          setConfirmEditOpen(false);
          setEditOpen(true);
        }}
      />

      <EditClientStatementEntryModal
        open={editOpen}
        onOpenChange={setEditOpen}
        clientId={clientId}
        line={line}
        onSuccess={onSuccess}
      />
    </>
  );
}