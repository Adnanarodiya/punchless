export function formatPaymentModeLabel(
  mode: string | null | undefined,
  bankName?: string | null
): string | null {
  if (!mode) return null;

  if (mode === "cash") return "Cash";
  if (mode === "credit") return "Credit";
  if (mode === "split") return "Split";
  if (mode === "bank") {
    return "Bank";
  }

  return mode.charAt(0).toUpperCase() + mode.slice(1);
}

export function bankAccountLabel(bank: {
  bank_name: string;
  account_name: string;
}) {
  return `${bank.bank_name} — ${bank.account_name}`;
}