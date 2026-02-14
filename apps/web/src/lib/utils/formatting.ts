/**
 * Format minutes into "Xh Ym" display string
 */
export function formatDuration(minutes: number | null): string {
  if (minutes === null || minutes === undefined) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

/**
 * Format ISO timestamp to local time string (HH:MM)
 */
export function formatTime(isoString: string | null): string {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format ISO timestamp to local date string
 */
export function formatDate(isoString: string | null): string {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format currency to INR (₹)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get live duration from start_time to now
 */
export function getLiveDurationMinutes(startTime: string): number {
  const start = new Date(startTime).getTime();
  const now = Date.now();
  return Math.round((now - start) / 60000);
}

/**
 * State display labels and colors
 */
export const STATE_CONFIG: Record<string, { label: string; colorClass: string; bgClass: string }> = {
  workshop: { label: "Workshop", colorClass: "text-state-workshop", bgClass: "bg-state-workshop/10" },
  travel: { label: "Travel", colorClass: "text-state-travel", bgClass: "bg-state-travel/10" },
  on_site_job: { label: "On-Site Job", colorClass: "text-state-onsite", bgClass: "bg-state-onsite/10" },
  off_duty: { label: "Off Duty", colorClass: "text-state-offduty", bgClass: "bg-state-offduty/10" },
  break: { label: "On Break", colorClass: "text-yellow-600", bgClass: "bg-yellow-50" },
};
