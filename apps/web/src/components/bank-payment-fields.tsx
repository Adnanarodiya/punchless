"use client";

import { useEffect, useState, type KeyboardEvent } from "react";

import { PaymentModeSelect } from "@punchless/ui/components/payment-mode-select";
import { cn } from "@punchless/ui/lib/utils";
import { BankAccountField } from "@/components/bank-account-field";
import type { BankWithBalance } from "@/lib/queries/bank.queries";
import { focusField } from "@/lib/utils/form-keyboard";

const fieldClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

const BANK_SUB_MODES = [
  { value: "upi", label: "UPI" },
  { value: "net_banking", label: "Net banking" },
] as const;

type Props = {
  banks: BankWithBalance[];
  defaultPaymentMode?: "cash" | "bank";
  includeCredit?: boolean;
  paymentModeSelectId?: string;
  bankSelectId?: string;
  bankChannelUpiId?: string;
  bankChannelNbId?: string;
  onPaymentModeEnter?: (mode: "cash" | "bank" | "credit") => void;
  onBankChannelEnter?: () => void;
  onBankAccountEnter?: () => void;
};

export function BankPaymentFields({
  banks,
  defaultPaymentMode = "cash",
  includeCredit = false,
  paymentModeSelectId = "paymentMode",
  bankSelectId = "bankPaymentBankId",
  bankChannelUpiId = "bankChannelUpi",
  bankChannelNbId = "bankChannelNb",
  onPaymentModeEnter,
  onBankChannelEnter,
  onBankAccountEnter,
}: Props) {
  const soleBankId = banks.length === 1 ? banks[0].id : "";
  const [paymentMode, setPaymentMode] = useState<"cash" | "bank" | "credit">(
    defaultPaymentMode
  );
  const [bankSubMode, setBankSubMode] = useState<"upi" | "net_banking" | "">("");
  const [bankId, setBankId] = useState(soleBankId);

  useEffect(() => {
    if (paymentMode === "bank" && banks.length === 1) {
      setBankId(banks[0].id);
    }
  }, [paymentMode, banks]);

  function handlePaymentModeKeyDown(event: KeyboardEvent<HTMLSelectElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (onPaymentModeEnter) {
      onPaymentModeEnter(paymentMode);
      return;
    }
    if (paymentMode === "bank") {
      focusField(bankChannelUpiId);
    }
  }

  function handleBankChannelEnter(event: KeyboardEvent<HTMLLabelElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (onBankChannelEnter) {
      onBankChannelEnter();
      return;
    }
    focusField(bankSelectId);
  }

  return (
    <>
      <div>
        <label
          htmlFor={paymentModeSelectId}
          className="mb-1 block text-sm font-medium"
        >
          Payment mode
        </label>
        <PaymentModeSelect
          id={paymentModeSelectId}
          name="paymentMode"
          includeCredit={includeCredit}
          value={paymentMode}
          onKeyDown={handlePaymentModeKeyDown}
          onChange={(e) => {
            const mode = e.target.value as "cash" | "bank" | "credit";
            setPaymentMode(mode);
            if (mode === "bank" && banks.length === 1) {
              setBankId(banks[0].id);
            }
            if (mode !== "bank") {
              setBankSubMode("");
              setBankId("");
            }
          }}
          className={fieldClass}
        />
      </div>

      {paymentMode === "bank" ? (
        <>
          <div>
            <span className="mb-2 block text-sm font-medium">Bank channel</span>
            <div className="grid grid-cols-2 gap-2">
              {BANK_SUB_MODES.map((option) => (
                <label
                  key={option.value}
                  id={option.value === "upi" ? bankChannelUpiId : bankChannelNbId}
                  tabIndex={0}
                  onKeyDown={handleBankChannelEnter}
                  className={cn(
                    "flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2.5 text-sm font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    bankSubMode === option.value
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-input text-muted-foreground hover:bg-accent/50"
                  )}
                >
                  <input
                    type="radio"
                    name="bankSubModeUi"
                    value={option.value}
                    checked={bankSubMode === option.value}
                    onChange={() => setBankSubMode(option.value)}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              ))}
            </div>
            <input type="hidden" name="bankSubMode" value={bankSubMode} />
          </div>

          <BankAccountField
            banks={banks}
            bankId={bankId}
            onBankIdChange={setBankId}
            id={bankSelectId}
            onEnterAdvance={onBankAccountEnter}
          />
        </>
      ) : (
        <>
          <input type="hidden" name="bankSubMode" value="" />
          <input type="hidden" name="bankId" value="" />
        </>
      )}
    </>
  );
}