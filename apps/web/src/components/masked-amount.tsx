"use client";

import type { ReactNode } from "react";

import { cn } from "@punchless/ui/lib/utils";

import { useFinancialLocked } from "@/lib/stores/data-lock.store";
import { formatCurrency } from "@/lib/utils/formatting";
import { maskAmount } from "@/lib/utils/mask-financial";

interface MaskedAmountProps {
  amount: number;
  className?: string;
  /** Custom formatter (e.g. signed net amounts). */
  format?: (amount: number) => string;
  children?: (formatted: string, locked: boolean) => ReactNode;
}

export function MaskedAmount({
  amount,
  className,
  format = formatCurrency,
  children,
}: MaskedAmountProps) {
  const locked = useFinancialLocked();
  const formatted = format(amount);
  const display = maskAmount(locked, formatted);

  if (children) {
    return <>{children(display, locked)}</>;
  }

  return (
    <span
      className={cn(locked && "tracking-widest text-muted-foreground", className)}
    >
      {display}
    </span>
  );
}

export function MaskedAmountText({
  amount,
  format = formatCurrency,
}: {
  amount: number;
  format?: (amount: number) => string;
}) {
  const locked = useFinancialLocked();
  return maskAmount(locked, format(amount));
}