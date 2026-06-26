/** Shared amount formatting for statement components (no ₹ prefix). */
export function formatStatementAmount(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
}

export function formatStatementDate(isoString: string): string {
  const normalized =
    isoString.length === 10 ? `${isoString}T00:00:00` : isoString;
  const date = new Date(normalized);
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleDateString("en-IN", { month: "short" });
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}