import { cn } from "../lib/utils";
import { formatStatementAmount } from "./statement-format";

export type BalanceStatus = "nil" | "due" | "advance";

export type BalanceMeta = {
  amount: number;
  status: BalanceStatus;
  label: string;
};

export interface BalanceBadgeProps {
  balance: BalanceMeta;
  className?: string;
  showLabel?: boolean;
}

export function BalanceBadge({
  balance,
  className,
  showLabel = true,
}: BalanceBadgeProps) {
  const colorClass =
    balance.status === "nil"
      ? "text-muted-foreground"
      : balance.status === "due"
        ? "text-destructive"
        : "text-success";

  const label =
    showLabel && balance.label ? ` (${balance.label})` : "";

  return (
    <span
      data-slot="balance-badge"
      className={cn("font-medium tabular-nums", colorClass, className)}
    >
      {formatStatementAmount(balance.amount)}
      {label}
    </span>
  );
}