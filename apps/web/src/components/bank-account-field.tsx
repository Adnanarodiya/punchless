"use client";

import { useEffect } from "react";

import { cn } from "@punchless/ui/lib/utils";
import type { BankWithBalance } from "@/lib/queries/bank.queries";
import { bankAccountLabel } from "@/lib/utils/payment-mode-display";

const fieldClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

type Props = {
  banks: BankWithBalance[];
  bankId: string;
  onBankIdChange: (id: string) => void;
  id?: string;
  name?: string;
  label?: string;
  className?: string;
};

export function BankAccountField({
  banks,
  bankId,
  onBankIdChange,
  id = "bankAccountId",
  name = "bankId",
  label = "Bank account",
  className,
}: Props) {
  const soleBank = banks.length === 1 ? banks[0] : null;

  useEffect(() => {
    if (soleBank && bankId !== soleBank.id) {
      onBankIdChange(soleBank.id);
    }
  }, [soleBank, bankId, onBankIdChange]);

  if (banks.length === 0) {
    return (
      <p className="text-sm text-destructive">
        Add a bank account under Banks before recording a bank entry.
      </p>
    );
  }

  if (soleBank) {
    return (
      <div className={className}>
        <span className="mb-1 block text-sm font-medium">{label}</span>
        <p
          className={cn(
            "rounded-lg border border-input bg-muted/30 px-3 py-2.5 text-sm font-medium text-foreground"
          )}
        >
          {bankAccountLabel(soleBank)}
        </p>
        <input type="hidden" name={name} value={soleBank.id} />
      </div>
    );
  }

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        name={name}
        required
        value={bankId}
        onChange={(e) => onBankIdChange(e.target.value)}
        className={fieldClass}
      >
        <option value="" disabled>
          Select bank
        </option>
        {banks.map((bank) => (
          <option key={bank.id} value={bank.id}>
            {bankAccountLabel(bank)}
          </option>
        ))}
      </select>
    </div>
  );
}