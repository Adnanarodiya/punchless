export function formatCreditNoteNumber(sequence: number) {
  return `CN-${String(sequence).padStart(4, "0")}`;
}

export function formatDebitNoteNumber(sequence: number) {
  return `DN-${String(sequence).padStart(4, "0")}`;
}

export function parseNoteSequence(number: string, prefix: "CN" | "DN") {
  const match = number.trim().match(new RegExp(`^${prefix}-(\\d+)$`, "i"));
  if (!match) return 0;
  return Number.parseInt(match[1], 10) || 0;
}