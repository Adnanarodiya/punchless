import { createClient } from "@/lib/supabase/server";
import type { Database } from "@punchless/types/database.types";

type AuditRow = Database["public"]["Tables"]["audit_logs"]["Row"];

export type AuditLogWithUser = AuditRow & {
  user_name: string | null;
  user_email: string | null;
};

export async function getAuditLogs(options: {
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<AuditLogWithUser[]> {
  const supabase = await createClient();
  const limit = options.limit ?? 200;

  let query = supabase
    .from("audit_logs")
    .select("*, users(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (options.startDate) {
    query = query.gte("created_at", `${options.startDate}T00:00:00`);
  }
  if (options.endDate) {
    query = query.lte("created_at", `${options.endDate}T23:59:59`);
  }

  const { data } = await query;

  type Raw = AuditRow & {
    users: { full_name: string; email: string } | null;
  };

  return ((data as unknown as Raw[]) ?? []).map((row) => ({
    ...row,
    user_name: row.users?.full_name ?? null,
    user_email: row.users?.email ?? null,
  }));
}