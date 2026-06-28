"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";

import { Button } from "@punchless/ui/components/button";
import { Modal } from "@punchless/ui/components/modal";
import { PaymentModeSelect } from "@punchless/ui/components/payment-mode-select";
import {
  deleteSupplierPayment,
  updateSupplierPayment,
} from "@/lib/actions/supplier.actions";
import { softDeletePurchaseInvoice } from "@/lib/actions/purchase.actions";
import { useAction } from "@/hooks/use-action";
import type { StatementLine } from "@/lib/utils/statement";

const fieldClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string;
  line: StatementLine | null;
  onSuccess?: () => void;
};

export function EditSupplierStatementEntryModal({
  open,
  onOpenChange,
  supplierId,
  line,
  onSuccess,
}: Props) {
  const [amount, setAmount] = useState("");
  const [entryDate, setEntryDate] = useState("");
  const [remark, setRemark] = useState("");
  const [paymentMode, setPaymentMode] = useState<"cash" | "bank" | "credit">("cash");

  useEffect(() => {
    if (!open || !line) return;

    setEntryDate(line.entry_date);
    setRemark(line.remark ?? "");

    if (line.editable_entity === "supplier_payment") {
      setAmount(String(line.debit > 0 ? line.debit : line.credit));
      setPaymentMode((line.payment_mode as "cash" | "bank" | "credit") || "cash");
    }
  }, [open, line]);

  const { execute: execUpdatePayment, loading: updatingPayment } = useAction(
    updateSupplierPayment,
    {
      successMessage: "Payment updated.",
      onSuccess: () => {
        onSuccess?.();
        onOpenChange(false);
      },
    }
  );

  const isPayment = line?.editable_entity === "supplier_payment";
  const isPurchase = line?.editable_entity === "purchase";
  const saving = updatingPayment;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!line?.editable_id || saving || !isPayment) return;

    const formData = new FormData(event.currentTarget);
    formData.set("paymentId", line.editable_id);
    formData.set("supplierId", supplierId);
    await execUpdatePayment(formData);
  }

  if (!line) return null;

  const entryLabel = isPayment
    ? "payment"
    : line.invoice_number
      ? `bill ${line.invoice_number}`
      : "supplier bill";

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`Edit ${entryLabel}`}
      className="sm:max-w-md"
    >
      {isPurchase ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Supplier bills with GST must be edited from the Purchases page so GST and line items
            stay correct. You can delete this row here if it was entered by mistake.
          </p>
          <Button asChild className="w-full">
            <Link href="/dashboard/purchases?openForm=1">Open Purchases</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="supplierStatementEditAmount" className="mb-1 block text-sm font-medium">
              Amount paid (₹)
            </label>
            <input
              id="supplierStatementEditAmount"
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={fieldClass}
            />
          </div>

          <div>
            <label
              htmlFor="supplierStatementEditPaymentMode"
              className="mb-1 block text-sm font-medium"
            >
              Payment mode
            </label>
            <PaymentModeSelect
              id="supplierStatementEditPaymentMode"
              name="paymentMode"
              includeCredit={false}
              value={paymentMode}
              onChange={(e) =>
                setPaymentMode(e.target.value as "cash" | "bank" | "credit")
              }
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="supplierStatementEditDate" className="mb-1 block text-sm font-medium">
              Date
            </label>
            <input
              id="supplierStatementEditDate"
              name="paymentDate"
              type="date"
              required
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="supplierStatementEditRemark" className="mb-1 block text-sm font-medium">
              Remark <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <input
              id="supplierStatementEditRemark"
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

export function useSupplierStatementEntryDelete(
  supplierId: string,
  onSuccess?: () => void
) {
  const { execute: execDeletePayment, loading: deletingPayment } = useAction(
    deleteSupplierPayment,
    {
      successMessage: "Payment deleted.",
      onSuccess,
    }
  );

  const { execute: execDeletePurchase, loading: deletingPurchase } = useAction(
    softDeletePurchaseInvoice,
    {
      successMessage: "Supplier bill deleted.",
      onSuccess,
    }
  );

  async function deleteEntry(line: StatementLine) {
    if (!line.editable_id) return;

    if (line.editable_entity === "supplier_payment") {
      const fd = new FormData();
      fd.set("supplierId", supplierId);
      fd.set("paymentId", line.editable_id);
      await execDeletePayment(fd);
      return;
    }

    if (line.editable_entity === "purchase") {
      const fd = new FormData();
      fd.set("purchaseId", line.editable_id);
      await execDeletePurchase(fd);
    }
  }

  return {
    deleteEntry,
    deleting: deletingPayment || deletingPurchase,
  };
}