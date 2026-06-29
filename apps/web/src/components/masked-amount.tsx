import type { ReactNode } from "react";

import { formatCurrency } from "@/lib/utils/formatting";

interface MaskedAmountProps {
  amount: number;
  className?: string;
  /** Prefix for ledger lines — safe to pass from Server Components. */
  sign?: "plus" | "minus";
  /** Custom formatter (client components only — do not pass from RSC). */
  format?: (amount: number) => string;
  children?: (formatted: string) => ReactNode;
}

function applySign(value: string, sign?: "plus" | "minus") {
  if (sign === "plus") return `+${value}`;
  if (sign === "minus") return `-${value}`;
  return value;
}

/** Displays a formatted amount. Data lock blur applies on home page summary cards only. */
export function MaskedAmount({
  amount,
  className,
  sign,
  format = formatCurrency,
  children,
}: MaskedAmountProps) {
  const formatted = applySign(format(amount), sign);

  if (children) {
    return <>{children(formatted)}</>;
  }

  return <span className={className}>{formatted}</span>;
}

export function MaskedAmountText({
  amount,
  className,
  format = formatCurrency,
}: {
  amount: number;
  className?: string;
  format?: (amount: number) => string;
}) {
  return <span className={className}>{format(amount)}</span>;
}