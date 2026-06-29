"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@punchless/ui/components/button";
import { Modal } from "@punchless/ui/components/modal";
import { PaymentModeSelect } from "@punchless/ui/components/payment-mode-select";
import { BankAccountField } from "@/components/bank-account-field";
import { createTransaction } from "@/lib/actions/transaction.actions";
import { useAction } from "@/hooks/use-action";
import type { BankWithBalance } from "@/lib/queries/bank.queries";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banks: BankWithBalance[];
  onSuccess?: () => void;
};

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

const fieldClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

export function AddExpenseModal({ open, onOpenChange, banks, onSuccess }: Props) {
  const router = useRouter();
  const [transactionType, setTransactionType] = useState<"income" | "expense">("expense");
  const [paymentMode, setPaymentMode] = useState<"cash" | "bank">("cash");
  const [bankId, setBankId] = useState(banks.length === 1 ? banks[0].id : "");
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (!open) {
      setTransactionType("expense");
      setPaymentMode("cash");
      setBankId(banks.length === 1 ? banks[0].id : "");
      return;
    }
    setFormKey((k) => k + 1);
  }, [open]);

  const { execute: execCreate, loading: saving } = useAction(createTransaction, {
    successMessage:
      transactionType === "income" ? "Income recorded." : "Expense recorded.",
    onSuccess: () => {
      onSuccess?.();
      onOpenChange(false);
      router.refresh();
    },
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const formData = new FormData(event.currentTarget);
    formData.set("transactionType", transactionType);
    await execCreate(formData);
  }

  const isIncome = transactionType === "income";

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Add expense / income"
      className="sm:max-w-md"
    >
      <p className="-mt-2 mb-4 text-center text-sm text-muted-foreground">
        Scrap sale, chai, repairs, light bill — no supplier or customer needed.
      </p>
      <form key={formKey} onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="addExpenseType" className="mb-1 block text-sm font-medium">
            Type
          </label>
          <select
            id="addExpenseType"
            name="transactionType"
            required
            value={transactionType}
            onChange={(e) =>
              setTransactionType(e.target.value as "income" | "expense")
            }
            className={fieldClass}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>

        <div>
          <label htmlFor="addExpenseParticular" className="mb-1 block text-sm font-medium">
            {isIncome ? "What was the income for?" : "What was it for?"}
          </label>
          <input
            id="addExpenseParticular"
            name="particular"
            type="text"
            required
            placeholder={
              isIncome
                ? "e.g. Scrap sale, Old parts"
                : "e.g. Chaiwala, AC repair, Eggs"
            }
            className={fieldClass}
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="addExpenseAmount" className="mb-1 block text-sm font-medium">
            Amount (₹)
          </label>
          <input
            id="addExpenseAmount"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            required
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="addExpensePaymentMode" className="mb-1 block text-sm font-medium">
            {isIncome ? "Received in" : "Paid by"}
          </label>
          <PaymentModeSelect
            id="addExpensePaymentMode"
            name="paymentMode"
            includeCredit={false}
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value as "cash" | "bank")}
            className={fieldClass}
          />
        </div>

        {paymentMode === "bank" ? (
          <BankAccountField
            banks={banks}
            bankId={bankId}
            onBankIdChange={setBankId}
            id="addExpenseBankId"
          />
        ) : (
          <input type="hidden" name="bankId" value="" />
        )}

        <div>
          <label htmlFor="addExpenseDate" className="mb-1 block text-sm font-medium">
            Date
          </label>
          <input
            id="addExpenseDate"
            name="transactionDate"
            type="date"
            required
            defaultValue={todayDate()}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="addExpenseRemark" className="mb-1 block text-sm font-medium">
            Remark <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id="addExpenseRemark"
            name="remark"
            type="text"
            placeholder="e.g. March light bill"
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
            {isIncome ? "Save income" : "Save expense"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}