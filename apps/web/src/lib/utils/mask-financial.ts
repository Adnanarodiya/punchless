export const MASKED_AMOUNT = "••••••";

export function maskAmount(locked: boolean, formatted: string): string {
  return locked ? MASKED_AMOUNT : formatted;
}