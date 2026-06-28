export type BalanceStatus = "nil" | "due" | "advance";

export type BalanceMeta = {
  amount: number;
  status: BalanceStatus;
  label: string;
};

export type StatementEditableEntity =
  | "invoice"
  | "client_payment"
  | "supplier_payment"
  | "purchase";

export type StatementLine = {
  id: string;
  index: number;
  entry_date: string;
  remark: string | null;
  reference_type: string | null;
  reference_id: string | null;
  entry_type: string;
  debit: number;
  credit: number;
  balance: number;
  balance_meta: BalanceMeta;
  invoice_number: string | null;
  vehicle_number: string | null;
  user_name: string | null;
  source: string;
  /** Set when row can be corrected from the statement screen. */
  editable_entity?: StatementEditableEntity | null;
  editable_id?: string | null;
  payment_mode?: string | null;
  /** Quick bill / invoice amount for edit form (taxable total). */
  bill_amount?: number | null;
  is_quick_bill?: boolean;
  cash_amount?: number | null;
  bank_amount?: number | null;
};

export type StatementResult = {
  opening: BalanceMeta;
  closing: BalanceMeta;
  totals: { debit: number; credit: number };
  lines: StatementLine[];
};

export type StatementEntityVariant = "client" | "supplier";

export function getBalanceMeta(
  amount: number,
  variant: StatementEntityVariant = "client"
): BalanceMeta {
  const rounded = Math.round(amount * 100) / 100;

  if (Math.abs(rounded) < 0.01) {
    return { amount: 0, status: "nil", label: "Nil B/F" };
  }

  if (rounded > 0) {
    return {
      amount: rounded,
      status: "due",
      label: variant === "supplier" ? "Payable" : "Due",
    };
  }

  return { amount: rounded, status: "advance", label: "Advance" };
}

export function formatStatementAmount(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
}

/** Re-index statement rows so the newest entry is #1 (display order). */
export function displayStatementLinesNewestFirst(
  lines: StatementLine[]
): StatementLine[] {
  const reversed = [...lines].reverse();
  return reversed.map((line, index) => ({ ...line, index: index + 1 }));
}

export function resolveStatementSource(referenceType: string | null): string {
  switch (referenceType) {
    case "opening_balance":
      return "opening_balance";
    case "invoice":
      return "invoice";
    case "payment":
      return "payment";
    case "purchase":
      return "purchase";
    default:
      return referenceType ?? "entry";
  }
}