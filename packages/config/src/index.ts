// ============================================
// Punchless — Shared Configuration
// ============================================

// Supabase config will be initialized here in Phase 2
// Both apps/web and apps/mobile will import from this package

export const APP_NAME = "Punchless";

export const ATTENDANCE_STATES = {
  OFF_DUTY: "off_duty",
  WORKSHOP: "workshop",
  TRAVEL: "travel",
  ON_SITE_JOB: "on_site_job",
} as const;

export const JOB_STATUSES = {
  PENDING: "pending",
  ASSIGNED: "assigned",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

// GPS tracking config
export const GPS_CONFIG = {
  /** Interval in ms when employee is OFF_DUTY */
  OFF_DUTY_INTERVAL: 60_000, // 60 seconds
  /** Interval in ms when employee is at WORKSHOP */
  WORKSHOP_INTERVAL: 30_000, // 30 seconds
  /** Interval in ms when employee is TRAVELING or ON_SITE */
  ACTIVE_INTERVAL: 15_000, // 15 seconds
  /** Grace period before marking as exited (ms) */
  EXIT_GRACE_PERIOD: 300_000, // 5 minutes
} as const;

// Pricing (used for display, Stripe handles actual billing)
export const PRICING = {
  PER_EMPLOYEE_MONTHLY: 800, // ₹800
  CURRENCY: "INR",
  TRIAL_DAYS: 14,
} as const;
