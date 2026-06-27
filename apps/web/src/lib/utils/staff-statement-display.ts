import { formatCurrency } from "@/lib/utils/formatting";

/**
 * Staff ledger balance from DB: negative = paid out to employee, positive = owed to employee.
 */
export function formatStaffLedgerTotal(balance: number): string {
  if (balance === 0) return formatCurrency(0);
  if (balance < 0) return formatCurrency(Math.abs(balance));
  return formatCurrency(balance);
}

export function staffLedgerSummaryHint(balance: number): string | undefined {
  if (balance < 0) return "Salary + advance you paid";
  if (balance > 0) return "Salary still owed to staff";
  return undefined;
}

export function staffPaymentInPeriod(opening: number, closing: number): number {
  return Math.round(Math.abs(opening - closing) * 100) / 100;
}

export function staffStatementTypeLabel(referenceType: string | null): string {
  switch (referenceType) {
    case "salary_deposit":
      return "Salary deposit";
    case "staff_payment":
      return "Salary paid";
    case "advance":
      return "Advance (Upad)";
    case "salary":
      return "Salary";
    default:
      return referenceType ?? "Entry";
  }
}