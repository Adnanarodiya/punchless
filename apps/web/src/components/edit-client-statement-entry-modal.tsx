"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";

import { Button } from "@punchless/ui/components/button";
import { Modal } from "@punchless/ui/components/modal";
import { PaymentModeSelect } from "@punchless/ui/components/payment-mode-select";
import { cn } from "@punchless/ui/lib/utils";
import {
  deleteClientPayment,
  updateClientPayment,
} from "@/lib/actions/client.actions";
import {
  softDeleteInvoice,
  updateStatementQuickBill,
} from "@/lib/actions/invoice.actions";
import { useAction } from "@/hooks/use-action";
import type { StatementLine } from "@/lib/utils/statement";
import { resolvePaymentBreakdown } from "@/lib/validations/invoice.schema";
import { formatCurrency } from "@/lib/utils/formatting";

type QuickBillPaymentMode = "cash" | "bank" | "credit" | "split";

const fieldClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  line: StatementLine | null;
  onSuccess?: () => void;
};

export function EditClientStatementEntryModal({
  open,
  onOpenChange,
  clientId,
  line,
  onSuccess,
}: Props) {
  const [amount, setAmount] = useState("");
  const [entryDate, setEntryDate] = useState("");
  const [remark, setRemark] = useState("");
  const [description, setDescription] = useState("");
  const [paymentMode, setPaymentMode] = useState<QuickBillPaymentMode>("cash");
  const [cashAmount, setCashAmount] = useState("");
  const [bankAmount, setBankAmount] = useState("");

  useEffect(() => {
    if (!open || !line) return;

    setEntryDate(line.entry_date);
    setRemark(line.remark ?? "");

    if (line.editable_entity === "client_payment") {
      setAmount(String(line.credit > 0 ? line.credit : line.debit));
      setPaymentMode((line.payment_mode as QuickBillPaymentMode) || "cash");
      setDescription("");
      setCashAmount("");
      setBankAmount("");
      return;
    }

    if (line.editable_entity === "invoice") {
      setAmount(String(line.bill_amount ?? line.debit ?? line.credit));
      setPaymentMode((line.payment_mode as QuickBillPaymentMode) || "credit");
      setCashAmount(line.cash_amount ? String(line.cash_amount) : "");
      setBankAmount(line.bank_amount ? String(line.bank_amount) : "");
      setDescription(line.remark?.replace(/ — received.*/i, "") ?? "");
    }
  }, [open, line]);

  const splitPreview = useMemo(() => {
    const billTotal = parseFloat(amount) || 0;
    if (paymentMode !== "split" || billTotal <= 0 || line?.editable_entity !== "invoice") {
      return null;
    }
    return resolvePaymentBreakdown(
      "split",
      billTotal,
      0,
      parseFloat(cashAmount) || 0,
      parseFloat(bankAmount) || 0
    );
  }, [amount, paymentMode, cashAmount, bankAmount, line?.editable_entity]);

  const { execute: execUpdatePayment, loading: updatingPayment } = useAction(
    updateClientPayment,
    {
      successMessage: "Payment updated.",
      onSuccess: () => {
        onSuccess?.();
        onOpenChange(false);
      },
    }
  );

  const { execute: execUpdateBill, loading: updatingBill } = useAction(
    updateStatementQuickBill,
    {
      successMessage: "Bill updated.",
      onSuccess: () => {
        onSuccess?.();
        onOpenChange(false);
      },
    }
  );

  const isPayment = line?.editable_entity === "client_payment";
  const isQuickBill = line?.editable_entity === "invoice" && line.is_quick_bill;
  const isGstInvoice = line?.editable_entity === "invoice" && !line.is_quick_bill;
  const saving = updatingPayment || updatingBill;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!line?.editable_id || saving) return;

    if (isPayment) {
      const formData = new FormData(event.currentTarget);
      formData.set("paymentId", line.editable_id);
      formData.set("clientId", clientId);
      await execUpdatePayment(formData);
      return;
    }

    if (isQuickBill) {
      const formData = new FormData(event.currentTarget);
      formData.set("invoiceId", line.editable_id);
      formData.set("clientId", clientId);
      await execUpdateBill(formData);
    }
  }

  if (!line) return null;

  const entryLabel =
    isPayment
      ? "payment"
      : line.invoice_number
        ? `bill ${line.invoice_number}`
        : "quick bill";

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`Edit ${entryLabel}`}
      className="sm:max-w-md"
    >
      {isGstInvoice ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            GST tax invoices must be edited from the Invoices page so GST and line items stay
            correct. You can delete this row here if it was entered by mistake.
          </p>
          <Button asChild className="w-full">
            <Link href={`/dashboard/invoices?openForm=1`}>Open Invoices</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="statementEditAmount" className="mb-1 block text-sm font-medium">
              {isPayment ? "Amount received (₹)" : "Bill amount (₹)"}
            </label>
            <input
              id="statementEditAmount"
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

          {isQuickBill ? (
            <>
              <div>
                <span className="mb-2 block text-sm font-medium">Payment</span>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { value: "cash", label: "Cash" },
                      { value: "bank", label: "Bank" },
                      { value: "credit", label: "Credit (Udhar)" },
                      { value: "split", label: "Cash + Bank" },
                    ] as const
                  ).map((option) => (
                    <label
                      key={option.value}
                      className={cn(
                        "flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2.5 text-sm font-medium transition",
                        paymentMode === option.value
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-input text-muted-foreground hover:bg-accent/50"
                      )}
                    >
                      <input
                        type="radio"
                        name="paymentMode"
                        value={option.value}
                        checked={paymentMode === option.value}
                        onChange={() => setPaymentMode(option.value)}
                        className="sr-only"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>

              {paymentMode === "split" ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="statementEditCashAmount"
                      className="mb-1 block text-sm font-medium"
                    >
                      Cash amount (₹)
                    </label>
                    <input
                      id="statementEditCashAmount"
                      name="cashAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={cashAmount}
                      onChange={(e) => setCashAmount(e.target.value)}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="statementEditBankAmount"
                      className="mb-1 block text-sm font-medium"
                    >
                      Bank amount (₹)
                    </label>
                    <input
                      id="statementEditBankAmount"
                      name="bankAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={bankAmount}
                      onChange={(e) => setBankAmount(e.target.value)}
                      className={fieldClass}
                    />
                  </div>
                  {splitPreview ? (
                    <p className="text-xs text-muted-foreground sm:col-span-2">
                      Cash {formatCurrency(splitPreview.cashAmount)} · Bank{" "}
                      {formatCurrency(splitPreview.bankAmount)}
                      {splitPreview.creditAmount > 0
                        ? ` · Udhar ${formatCurrency(splitPreview.creditAmount)}`
                        : null}
                    </p>
                  ) : null}
                </div>
              ) : (
                <>
                  <input type="hidden" name="cashAmount" value="0" />
                  <input type="hidden" name="bankAmount" value="0" />
                </>
              )}
            </>
          ) : (
            <div>
              <label htmlFor="statementEditPaymentMode" className="mb-1 block text-sm font-medium">
                Payment mode
              </label>
              <PaymentModeSelect
                id="statementEditPaymentMode"
                name="paymentMode"
                includeCredit={false}
                value={paymentMode === "split" ? "cash" : paymentMode}
                onChange={(e) =>
                  setPaymentMode(e.target.value as "cash" | "bank" | "credit")
                }
                className={fieldClass}
              />
            </div>
          )}

          <div>
            <label htmlFor="statementEditDate" className="mb-1 block text-sm font-medium">
              Date
            </label>
            <input
              id="statementEditDate"
              name={isPayment ? "paymentDate" : "invoiceDate"}
              type="date"
              required
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className={fieldClass}
            />
          </div>

          {isQuickBill ? (
            <div>
              <label htmlFor="statementEditDescription" className="mb-1 block text-sm font-medium">
                Note <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <input
                id="statementEditDescription"
                name="description"
                type="text"
                maxLength={200}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={fieldClass}
              />
            </div>
          ) : (
            <div>
              <label htmlFor="statementEditRemark" className="mb-1 block text-sm font-medium">
                Remark <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <input
                id="statementEditRemark"
                name="remark"
                type="text"
                maxLength={500}
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                className={fieldClass}
              />
            </div>
          )}

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

export function useClientStatementEntryDelete(clientId: string, onSuccess?: () => void) {
  const { execute: execDeletePayment, loading: deletingPayment } = useAction(
    deleteClientPayment,
    {
      successMessage: "Payment deleted.",
      onSuccess,
    }
  );

  const { execute: execDeleteInvoice, loading: deletingInvoice } = useAction(softDeleteInvoice, {
    successMessage: "Bill deleted.",
    onSuccess,
  });

  async function deleteEntry(line: StatementLine) {
    if (!line.editable_id) return;

    if (line.editable_entity === "client_payment") {
      const fd = new FormData();
      fd.set("clientId", clientId);
      fd.set("paymentId", line.editable_id);
      await execDeletePayment(fd);
      return;
    }

    if (line.editable_entity === "invoice") {
      const fd = new FormData();
      fd.set("invoiceId", line.editable_id);
      await execDeleteInvoice(fd);
    }
  }

  return {
    deleteEntry,
    deleting: deletingPayment || deletingInvoice,
  };
}