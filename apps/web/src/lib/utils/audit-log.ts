import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@punchless/types/database.types";

type AppSupabase = SupabaseClient<Database>;

export type AuditLogInput = {
  companyId: string;
  userId: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  summary?: string | null;
};

const ENTITY_ID_KEYS = [
  "clientId",
  "employeeId",
  "supplierId",
  "invoiceId",
  "purchaseId",
  "bankId",
  "transactionId",
  "postId",
  "workshopId",
  "jobId",
  "advanceId",
  "paymentId",
  "depositId",
  "sessionId",
  "adminUserId",
  "noteId",
];

export function extractEntityIdFromInput(input: unknown): string | null {
  if (!(input instanceof FormData)) return null;
  for (const key of ENTITY_ID_KEYS) {
    const value = String(input.get(key) || "").trim();
    if (value) return value;
  }
  return null;
}

export async function logAudit(
  supabase: AppSupabase,
  entry: AuditLogInput
): Promise<void> {
  const { error } = await supabase.from("audit_logs").insert({
    company_id: entry.companyId,
    user_id: entry.userId,
    action: entry.action,
    entity_type: entry.entityType ?? null,
    entity_id: entry.entityId ?? null,
    summary: entry.summary ?? null,
  } as never);

  if (error) {
    console.error("Failed to write audit log:", error.message);
  }
}