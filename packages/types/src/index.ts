// ============================================
// Punchless — Shared TypeScript Types
// ============================================

// Auto-generated Supabase Database types
// Regenerate with: npx supabase gen types typescript --project-id hrjarkhzmhgdrlkzpkka > packages/types/src/database.types.ts
export type { Database } from "./database.types";
export type { Tables, TablesInsert, TablesUpdate, Enums } from "./database.types";

// --- Enums / Literal Types ---

export type UserRole = "owner" | "admin" | "employee";

export type SubscriptionStatus = "trial" | "active" | "inactive" | "cancelled";

export type AttendanceState = "workshop" | "travel" | "on_site_job" | "off_duty";

export type JobStatus = "pending" | "assigned" | "in_progress" | "completed" | "cancelled";

export type AdvanceStatus = "pending" | "approved" | "rejected";

export type PaymentMode = "cash" | "bank" | "credit";

export type LedgerEntityType = "client" | "supplier" | "staff" | "bank" | "expense";

export type LedgerEntryType = "debit" | "credit";

export type LedgerReferenceType =
  | "invoice"
  | "payment"
  | "advance"
  | "salary"
  | "expense"
  | "opening_balance"
  | "purchase";

export type PurchaseInvoiceType = "purchase" | "sales";

export type TaxInvoicePaymentMode = "cash" | "bank" | "credit" | "split";

// --- Database Models ---

export interface Company {
  id: string;
  name: string;
  subscription_status: SubscriptionStatus;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  company_id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone: string | null;
  hourly_rate: number;
  daily_shift_hours: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Workshop {
  id: string;
  company_id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  radius: number;
  is_active: boolean;
  created_at: string;
  deleted_at: string | null;
}

export interface Job {
  id: string;
  company_id: string;
  workshop_id: string | null;
  assigned_to: string | null;
  title: string;
  description: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  lat: number | null;
  lng: number | null;
  radius: number;
  status: JobStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface AttendanceSession {
  id: string;
  company_id: string;
  employee_id: string;
  state: AttendanceState;
  job_id: string | null;
  workshop_id: string | null;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  created_at: string;
}

export interface SalaryAdvance {
  id: string;
  company_id: string;
  employee_id: string;
  amount: number;
  reason: string | null;
  status: AdvanceStatus;
  approved_by: string | null;
  approved_at: string | null;
  notes: string | null;
  salary_month: string | null;
  requested_at: string;
  created_at: string;
}

// --- Salary Calculation ---

export interface SalaryBreakdown {
  employee_id: string;
  month: string;
  workshop_hours: number;
  travel_hours: number;
  on_site_hours: number;
  total_hours: number;
  standard_hours: number;
  overtime_hours: number;
  workshop_pay: number;
  travel_pay: number;
  on_site_pay: number;
  gross_pay: number;
  overtime_pay: number;
  advance_deduction: number;
  net_pay: number;
}
