import * as React from "react";

import { cn } from "../lib/utils";

export const PAYMENT_MODES = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank" },
  { value: "credit", label: "Credit" },
] as const;

export type PaymentMode = (typeof PAYMENT_MODES)[number]["value"];

export interface PaymentModeSelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  includeCredit?: boolean;
}

export function PaymentModeSelect({
  className,
  includeCredit = true,
  ...props
}: PaymentModeSelectProps) {
  const modes = includeCredit
    ? PAYMENT_MODES
    : PAYMENT_MODES.filter((mode) => mode.value !== "credit");

  return (
    <select
      data-slot="payment-mode-select"
      className={cn(
        "h-10 w-full cursor-pointer rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    >
      {modes.map((mode) => (
        <option key={mode.value} value={mode.value}>
          {mode.label}
        </option>
      ))}
    </select>
  );
}