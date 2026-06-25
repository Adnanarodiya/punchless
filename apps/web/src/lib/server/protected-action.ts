import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import type { ActionResult } from "@/lib/utils/action-result";
import {
  extractEntityIdFromInput,
  logAudit,
} from "@/lib/utils/audit-log";

type UserRow = Database["public"]["Tables"]["users"]["Row"];
type AllowedRole = "owner" | "admin" | "employee";

export type AuditActionConfig<TInput = unknown> = {
  action: string;
  entityType?: string;
  entityId?: (input: TInput, me: UserRow) => string | null;
  summary?: (input: TInput, me: UserRow) => string | null;
};

export type AuthenticatedContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  me: UserRow;
};

/**
 * Higher-order function that wraps server actions with:
 * - Authentication check
 * - Role-based permission check
 * - Automatic try/catch error handling
 *
 * Usage:
 *   export const myAction = protectedAction({ roles: ["owner", "admin"] })(
 *     async (input, { supabase, me }) => {
 *       // your logic here
 *       return { success: true };
 *     }
 *   );
 */
export function protectedAction<TInput = void>({
  roles,
  audit,
}: {
  roles: AllowedRole[];
  audit?: AuditActionConfig<TInput>;
}) {
  return (
    action: (input: TInput, ctx: AuthenticatedContext) => Promise<ActionResult>
  ): ((input: TInput) => Promise<ActionResult>) => {
    return async (input: TInput): Promise<ActionResult> => {
      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return { success: false, error: "Not authenticated. Please log in." };
        }

        const { data } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        const me = data as UserRow | null;

        if (!me) {
          return { success: false, error: "User profile not found." };
        }

        if (!roles.includes(me.role as AllowedRole)) {
          return {
            success: false,
            error: `This action requires ${roles.join(" or ")} role.`,
          };
        }

        const result = await action(input, { supabase, me });

        if (result.success && audit) {
          await logAudit(supabase, {
            companyId: me.company_id,
            userId: me.id,
            action: audit.action,
            entityType: audit.entityType ?? null,
            entityId:
              audit.entityId?.(input, me) ??
              extractEntityIdFromInput(input),
            summary: audit.summary?.(input, me) ?? null,
          });
        }

        return result;
      } catch (error) {
        console.error("Protected action error:", error);
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred.",
        };
      }
    };
  };
}
