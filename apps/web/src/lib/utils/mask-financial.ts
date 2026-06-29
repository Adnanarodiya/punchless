/** CSS classes for home page summary cards when financial data is locked. */
export function lockedBlurClass(locked: boolean): string {
  return locked ? "inline-block blur-sm select-none" : "";
}