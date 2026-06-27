export type AuditPillTone =
  | "success"
  | "warning"
  | "destructive"
  | "primary"
  | "muted"
  | "workshop"
  | "travel";

export type AuditActionDisplay = {
  label: string;
  tone: AuditPillTone;
  summary?: string;
};

export type AuditEntityDisplay = {
  label: string;
  tone: AuditPillTone;
};

const TONE_CLASS: Record<AuditPillTone, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  primary: "bg-primary/10 text-primary",
  muted: "bg-muted text-muted-foreground",
  workshop: "bg-state-workshop/10 text-state-workshop",
  travel: "bg-state-travel/10 text-state-travel",
};

const ACTION_CONFIG: Record<string, AuditActionDisplay> = {
  create_client: { label: "Customer Added", tone: "success", summary: "New customer created" },
  update_client: { label: "Customer Updated", tone: "primary", summary: "Customer details changed" },
  soft_delete_client: { label: "Customer Removed", tone: "destructive", summary: "Customer archived" },
  recover_client: { label: "Customer Restored", tone: "success", summary: "Customer recovered from archive" },
  receive_client_payment: {
    label: "Payment Received",
    tone: "success",
    summary: "Customer payment recorded — credit received",
  },

  create_supplier: { label: "Supplier Added", tone: "success", summary: "New supplier created" },
  update_supplier: { label: "Supplier Updated", tone: "primary", summary: "Supplier details changed" },
  soft_delete_supplier: { label: "Supplier Removed", tone: "destructive", summary: "Supplier archived" },
  recover_supplier: { label: "Supplier Restored", tone: "success", summary: "Supplier recovered" },
  pay_supplier: {
    label: "Supplier Paid",
    tone: "warning",
    summary: "Payment sent to supplier — funds out",
  },

  create_invoice: { label: "Invoice Created", tone: "success", summary: "New tax invoice issued" },
  update_invoice: { label: "Invoice Updated", tone: "primary", summary: "Invoice details changed" },
  soft_delete_invoice: { label: "Invoice Deleted", tone: "destructive", summary: "Invoice removed" },

  create_purchase_invoice: {
    label: "Supplier Bill Added",
    tone: "warning",
    summary: "Supplier bill recorded",
  },
  update_purchase_invoice: { label: "Supplier Bill Updated", tone: "primary", summary: "Supplier bill changed" },
  soft_delete_purchase_invoice: {
    label: "Supplier Bill Deleted",
    tone: "destructive",
    summary: "Supplier bill removed",
  },

  create_bank: { label: "Bank Added", tone: "success", summary: "New bank account created" },
  update_bank: { label: "Bank Updated", tone: "primary", summary: "Bank account details changed" },
  soft_delete_bank: { label: "Bank Removed", tone: "destructive", summary: "Bank account archived" },
  recover_bank: { label: "Bank Restored", tone: "success", summary: "Bank account recovered" },
  record_bank_transaction: {
    label: "Bank Entry",
    tone: "travel",
    summary: "Bank deposit or withdrawal recorded",
  },
  record_bank_transfer: {
    label: "Bank Transfer",
    tone: "travel",
    summary: "Funds moved between bank accounts",
  },

  create_transaction: {
    label: "Income / Expense",
    tone: "warning",
    summary: "Cash or bank income/expense recorded",
  },
  delete_transaction: {
    label: "Transaction Deleted",
    tone: "destructive",
    summary: "Income/expense entry removed",
  },

  create_employee: { label: "Employee Added", tone: "success", summary: "New employee onboarded" },
  update_employee: { label: "Employee Updated", tone: "primary", summary: "Employee profile changed" },
  toggle_employee_status: {
    label: "Employee Status",
    tone: "warning",
    summary: "Employee active/inactive toggled",
  },
  delete_employee: {
    label: "Employee Deleted",
    tone: "destructive",
    summary: "Employee account removed — critical",
  },

  create_staff_payment: {
    label: "Salary Paid",
    tone: "warning",
    summary: "Staff salary payment recorded — funds out",
  },
  create_salary_deposit: {
    label: "Salary Credited",
    tone: "success",
    summary: "Monthly salary deposit accrued — credit added",
  },
  delete_staff_payment: {
    label: "Payment Reversed",
    tone: "destructive",
    summary: "Staff payment entry deleted",
  },
  delete_salary_deposit: {
    label: "Deposit Reversed",
    tone: "destructive",
    summary: "Salary deposit entry deleted",
  },

  create_post: { label: "Post Added", tone: "success", summary: "New job post/role created" },
  update_post: { label: "Post Updated", tone: "primary", summary: "Post details changed" },
  soft_delete_post: { label: "Post Removed", tone: "destructive", summary: "Post archived" },
  recover_post: { label: "Post Restored", tone: "success", summary: "Post recovered" },

  create_workshop: { label: "Workshop Added", tone: "success", summary: "New workshop location created" },
  update_workshop: { label: "Workshop Updated", tone: "primary", summary: "Workshop details changed" },
  toggle_workshop_status: {
    label: "Workshop Status",
    tone: "warning",
    summary: "Workshop active/inactive toggled",
  },
  delete_workshop: { label: "Workshop Deleted", tone: "destructive", summary: "Workshop removed" },

  create_job: { label: "Job Created", tone: "success", summary: "New job assigned" },
  update_job: { label: "Job Updated", tone: "primary", summary: "Job details or status changed" },
  delete_job: { label: "Job Deleted", tone: "destructive", summary: "Job removed" },

  create_advance: { label: "Advance Requested", tone: "warning", summary: "Salary advance request created" },
  approve_advance: { label: "Advance Approved", tone: "success", summary: "Advance approved — will deduct from salary" },
  reject_advance: { label: "Advance Rejected", tone: "destructive", summary: "Advance request rejected" },
  delete_advance: { label: "Advance Deleted", tone: "destructive", summary: "Advance record removed" },

  create_attendance_session: {
    label: "Session Opened",
    tone: "workshop",
    summary: "Manual attendance session started",
  },
  close_attendance_session: {
    label: "Session Closed",
    tone: "primary",
    summary: "Attendance session ended",
  },
  delete_attendance_session: {
    label: "Session Deleted",
    tone: "destructive",
    summary: "Attendance session removed",
  },
  bulk_mark_attendance: {
    label: "Bulk Present",
    tone: "workshop",
    summary: "Bulk attendance marked for date",
  },
  approve_correction: {
    label: "Correction Approved",
    tone: "success",
    summary: "Attendance correction request approved",
  },
  reject_correction: {
    label: "Correction Rejected",
    tone: "destructive",
    summary: "Attendance correction request rejected",
  },

  invite_admin: {
    label: "Admin Invited",
    tone: "primary",
    summary: "New dashboard admin account created",
  },
  deactivate_admin: {
    label: "Admin Deactivated",
    tone: "destructive",
    summary: "Admin access revoked — critical",
  },
  change_password: {
    label: "Password Changed",
    tone: "warning",
    summary: "Account password updated — security",
  },

  update_company_settings: {
    label: "Settings Saved",
    tone: "primary",
    summary: "Company work schedule settings updated",
  },
  upload_fingerprint_attendance: {
    label: "Attendance Uploaded",
    tone: "primary",
    summary: "Fingerprint attendance sheet imported for salary",
  },
  map_fingerprint_alias: {
    label: "Name Mapped",
    tone: "primary",
    summary: "Fingerprint name linked to employee",
  },
  set_data_lock_pin: {
    label: "Data Lock Set",
    tone: "warning",
    summary: "Dashboard financial data lock PIN configured",
  },
  remove_data_lock_pin: {
    label: "Data Lock Removed",
    tone: "destructive",
    summary: "Financial data lock disabled",
  },
  create_sticky_note: {
    label: "Note Added",
    tone: "warning",
    summary: "Sticky note created on dashboard",
  },
  update_sticky_note: {
    label: "Note Updated",
    tone: "primary",
    summary: "Sticky note edited",
  },
  delete_sticky_note: {
    label: "Note Deleted",
    tone: "destructive",
    summary: "Sticky note removed",
  },
};

const ENTITY_CONFIG: Record<string, AuditEntityDisplay> = {
  client: { label: "Customer", tone: "primary" },
  supplier: { label: "Supplier", tone: "warning" },
  invoice: { label: "Invoice", tone: "success" },
  purchase: { label: "Supplier bill", tone: "warning" },
  bank: { label: "Bank", tone: "travel" },
  transaction: { label: "Transaction", tone: "warning" },
  employee: { label: "Employee", tone: "workshop" },
  "staff-payment": { label: "Staff Pay", tone: "warning" },
  post: { label: "Post", tone: "muted" },
  workshop: { label: "Workshop", tone: "workshop" },
  job: { label: "Job", tone: "travel" },
  advance: { label: "Advance", tone: "warning" },
  attendance: { label: "Attendance", tone: "workshop" },
  correction_request: { label: "Correction", tone: "workshop" },
  user: { label: "User", tone: "destructive" },
  settings: { label: "Settings", tone: "muted" },
  sticky_note: { label: "Note", tone: "warning" },
};

function inferActionFromSlug(action: string): AuditActionDisplay {
  if (action.startsWith("create_")) {
    return { label: titleCase(action.replace("create_", "")), tone: "success" };
  }
  if (action.startsWith("update_")) {
    return { label: titleCase(action.replace("update_", "")), tone: "primary" };
  }
  if (action.startsWith("soft_delete_") || action.startsWith("delete_")) {
    return { label: titleCase(action.replace(/^(soft_delete_|delete_)/, "")), tone: "destructive" };
  }
  if (action.startsWith("recover_")) {
    return { label: titleCase(action.replace("recover_", "")), tone: "success" };
  }
  if (action.startsWith("approve_")) {
    return { label: titleCase(action.replace("approve_", "")), tone: "success" };
  }
  if (action.startsWith("reject_")) {
    return { label: titleCase(action.replace("reject_", "")), tone: "destructive" };
  }
  if (action.startsWith("pay_") || action.startsWith("record_")) {
    return { label: titleCase(action), tone: "warning" };
  }
  return { label: titleCase(action), tone: "muted" };
}

function titleCase(slug: string): string {
  return slug
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getAuditActionDisplay(action: string): AuditActionDisplay {
  return ACTION_CONFIG[action] ?? inferActionFromSlug(action);
}

export function getAuditEntityDisplay(entityType: string | null): AuditEntityDisplay | null {
  if (!entityType) return null;
  return (
    ENTITY_CONFIG[entityType] ?? {
      label: titleCase(entityType),
      tone: "muted",
    }
  );
}

export function getAuditPillClassName(tone: AuditPillTone): string {
  return TONE_CLASS[tone];
}

export function formatAuditSummary(
  action: string,
  entityType: string | null,
  summary: string | null
): string {
  if (summary?.trim()) return summary.trim();

  const actionDisplay = getAuditActionDisplay(action);
  if (actionDisplay.summary) return actionDisplay.summary;

  const entity = getAuditEntityDisplay(entityType);
  if (entity) return `${actionDisplay.label} · ${entity.label}`;
  return actionDisplay.label;
}

export function getAuditSearchText(
  action: string,
  entityType: string | null,
  summary: string | null
): string {
  const actionDisplay = getAuditActionDisplay(action);
  const entity = getAuditEntityDisplay(entityType);
  return [
    action,
    actionDisplay.label,
    entity?.label,
    entityType,
    formatAuditSummary(action, entityType, summary),
    summary,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}