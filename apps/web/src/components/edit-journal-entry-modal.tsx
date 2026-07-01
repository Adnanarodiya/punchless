"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import { Button } from "@punchless/ui/components/button";
import { Modal } from "@punchless/ui/components/modal";
import { BankPaymentFields } from "@/components/bank-payment-fields";
import {
  deleteDiscountSettlement,
  deleteJournalNote,
  loadDiscountSettlementDetail,
  updateDiscountSettlement,
  updateJournalNote,
} from "@/lib/actions/journal-edit.actions";
import { useAction } from "@/hooks/use-action";
import type { BankWithBalance } from "@/lib/queries/bank.queries";
import type { StatementEditableEntity, StatementLine } from "@/lib/utils/statement";
import { formatCurrency } from "@/lib/utils/formatting";

const fieldClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  line: StatementLine | null;
  banks: BankWithBalance[];
  onSuccess?: () => void;
};

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

type DiscountDetailData = {
  billAmount: number;
  discountAmount: number;
  paymentAmount: number;
  paymentMode: "cash" | "bank";
  bankSubMode: "upi" | "net_banking" | null;
  bankId: string | null;
  entryDate: string;
  remark: string | null;
};

function journalEntityLabel(entity: StatementEditableEntity | null | undefined) {
  switch (entity) {
    case "discount_settlement":
      return "Discount settlement";
    case "credit_note":
    case "supplier_credit_note":
      return "Credit note";
    case "debit_note":
    case "supplier_debit_note":
      return "Debit note";
    default:
      return "Journal entry";
  }
}

export function EditJournalEntryModal({
  open,
  onOpenChange,
  line,
  banks,
  onSuccess,
}: Props) {
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [billAmount, setBillAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState("");
  const [noteAmount, setNoteAmount] = useState("");
  const [entryDate, setEntryDate] = useState("");
  const [remark, setRemark] = useState("");
  const [paymentMode, setPaymentMode] = useState<"cash" | "bank">("cash");
  const [bankId, setBankId] = useState("");
  const [bankSubMode, setBankSubMode] = useState<"upi" | "net_banking" | "">(
    ""
  );

  const isDiscount = line?.editable_entity === "discount_settlement";
  const isNote =
    line?.editable_entity === "credit_note" ||
    line?.editable_entity === "debit_note" ||
    line?.editable_entity === "supplier_credit_note" ||
    line?.editable_entity === "supplier_debit_note";

  const paymentAmount = useMemo(() => {
    const discount = Number(discountAmount) || 0;
    if (!billAmount || !discount) return 0;
    return roundMoney(Math.max(0, billAmount - discount));
  }, [billAmount, discountAmount]);

  useEffect(() => {
    if (!open || !line?.editable_id) return;

    setEntryDate(line.entry_date);
    setRemark(line.remark ?? "");

    if (isNote) {
      setNoteAmount(String(line.credit > 0 ? line.credit : line.debit));
      setDiscountAmount("");
      setBillAmount(0);
      return;
    }

    if (!isDiscount) return;

    let cancelled = false;
    setLoadingDetail(true);

    void loadDiscountSettlementDetail(line.editable_id).then((result) => {
      if (cancelled || !result.success || !result.data) {
        if (!cancelled) setLoadingDetail(false);
        return;
      }
      const detail = result.data as DiscountDetailData;
      setBillAmount(detail.billAmount);
      setDiscountAmount(String(detail.discountAmount));
      setPaymentMode(detail.paymentMode);
      setBankId(detail.bankId ?? "");
      setBankSubMode(detail.bankSubMode ?? "");
      setRemark(detail.remark ?? line.remark ?? "");
      setEntryDate(detail.entryDate);
      setLoadingDetail(false);
    });

    return () => {
      cancelled = true;
    };
  }, [open, line, isDiscount, isNote]);

  const { execute: saveDiscount, loading: savingDiscount } = useAction(
    updateDiscountSettlement,
    {
      successMessage: "Discount settlement updated.",
      onSuccess: () => {
        onSuccess?.();
        onOpenChange(false);
      },
    }
  );

  const { execute: saveNote, loading: savingNote } = useAction(updateJournalNote, {
    successMessage: "Journal note updated.",
    onSuccess: () => {
      onSuccess?.();
      onOpenChange(false);
    },
  });

  const saving = savingDiscount || savingNote || loadingDetail;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!line?.editable_id || saving) return;

    if (isDiscount) {
      const discount = Number(discountAmount);
      if (!discount || discount <= 0) return;
      if (discount >= billAmount) return;

      await saveDiscount(new FormData(event.currentTarget));
      return;
    }

    if (isNote && line.editable_entity) {
      const formData = new FormData(event.currentTarget);
      formData.set("noteId", line.editable_id);
      formData.set("noteType", line.editable_entity);
      await saveNote(formData);
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`Edit ${journalEntityLabel(line?.editable_entity)}`}
    >
      {loadingDetail && isDiscount ? (
        <p className="text-sm text-muted-foreground">Loading settlement details…</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {isDiscount ? (
            <>
              <p className="text-sm text-muted-foreground">
                Bill settled:{" "}
                <span className="font-medium text-foreground">
                  {formatCurrency(billAmount)}
                </span>
              </p>
              <div>
                <label htmlFor="editJournalDiscount" className="mb-1 block text-sm font-medium">
                  Discount amount (₹)
                </label>
                <input
                  id="editJournalDiscount"
                  name="discountAmount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  className={fieldClass}
                />
                {Number(discountAmount) > 0 ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Payment:{" "}
                    <span className="font-medium text-foreground">
                      {formatCurrency(paymentAmount)}
                    </span>
                  </p>
                ) : null}
              </div>
              <input type="hidden" name="settlementId" value={line.editable_id ?? ""} />
              <BankPaymentFields
                key={`${line.editable_id}-${paymentMode}-${bankId}-${bankSubMode}`}
                banks={banks}
                paymentModeSelectId="editJournalPaymentMode"
                bankSelectId="editJournalBankId"
                bankChannelUpiId="editJournalBankUpi"
                bankChannelNbId="editJournalBankNb"
                defaultPaymentMode={paymentMode}
                defaultBankId={bankId || undefined}
                defaultBankSubMode={bankSubMode}
              />
            </>
          ) : null}

          {isNote ? (
            <div>
              <input type="hidden" name="noteId" value={line?.editable_id ?? ""} />
              <input type="hidden" name="noteType" value={line?.editable_entity ?? ""} />
              <label htmlFor="editJournalNoteAmount" className="mb-1 block text-sm font-medium">
                Amount (₹)
              </label>
              <input
                id="editJournalNoteAmount"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                required
                value={noteAmount}
                onChange={(e) => setNoteAmount(e.target.value)}
                className={fieldClass}
              />
            </div>
          ) : null}

          <div>
            <label htmlFor="editJournalDate" className="mb-1 block text-sm font-medium">
              Date
            </label>
            <input
              id="editJournalDate"
              name="entryDate"
              type="date"
              required
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="editJournalRemark" className="mb-1 block text-sm font-medium">
              Remark <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <input
              id="editJournalRemark"
              name="remark"
              type="text"
              maxLength={500}
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className={fieldClass}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saving} disabled={saving}>
              Save changes
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export function useJournalEntryDelete(onSuccess?: () => void) {
  const { execute: execDeleteDiscount, loading: deletingDiscount } = useAction(
    deleteDiscountSettlement,
    {
      successMessage: "Discount settlement deleted.",
      onSuccess,
    }
  );

  const { execute: execDeleteNote, loading: deletingNote } = useAction(deleteJournalNote, {
    successMessage: "Journal note deleted.",
    onSuccess,
  });

  async function deleteEntry(line: StatementLine) {
    if (!line.editable_id || !line.editable_entity) return;

    if (line.editable_entity === "discount_settlement") {
      const fd = new FormData();
      fd.set("entryId", line.editable_id);
      await execDeleteDiscount(fd);
      return;
    }

    if (
      line.editable_entity === "credit_note" ||
      line.editable_entity === "debit_note" ||
      line.editable_entity === "supplier_credit_note" ||
      line.editable_entity === "supplier_debit_note"
    ) {
      const fd = new FormData();
      fd.set("entryId", line.editable_id);
      fd.set("noteType", line.editable_entity);
      await execDeleteNote(fd);
    }
  }

  return {
    deleteEntry,
    deleting: deletingDiscount || deletingNote,
  };
}