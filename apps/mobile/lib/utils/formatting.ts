export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

/**
 * Format an ISO start_time into a live HH:MM:SS string from now
 */
export function formatLiveTimer(startIso: string): string {
  const startMs = new Date(startIso).getTime();
  const nowMs = Date.now();
  const diffSec = Math.max(0, Math.floor((nowMs - startMs) / 1000));

  const h = Math.floor(diffSec / 3600);
  const m = Math.floor((diffSec % 3600) / 60);
  const s = diffSec % 60;

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/**
 * Get elapsed minutes from an ISO start_time to now
 */
export function getElapsedMinutes(startIso: string): number {
  const startMs = new Date(startIso).getTime();
  return Math.max(0, (Date.now() - startMs) / 60000);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getCurrentMonthString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
