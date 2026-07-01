import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@punchless/types/database.types";

type LedgerEntryRow = Database["public"]["Tables"]["ledger_entries"]["Row"];

type LedgerBalanceRow = Pick<LedgerEntryRow, "entity_id" | "entry_type" | "amount">;

const PAGE_SIZE = 1000;

async function fetchLedgerPages<T>(
  supabase: SupabaseClient<Database>,
  fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: Error | null }>
): Promise<T[]> {
  const rows: T[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await fetchPage(from, from + PAGE_SIZE - 1);
    if (error) throw error;

    const page = data ?? [];
    rows.push(...page);

    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
}

/**
 * Fetch all ledger rows for an entity type (Supabase default max is 1000 rows).
 * Avoids huge `.in()` URL filters — optional entityIds are filtered in memory.
 */
export async function fetchAllLedgerEntries(
  supabase: SupabaseClient<Database>,
  entityType: LedgerEntryRow["entity_type"],
  entityIds?: string[]
): Promise<LedgerBalanceRow[]> {
  const idSet = entityIds?.length ? new Set(entityIds) : null;

  const rows = await fetchLedgerPages<LedgerBalanceRow>(supabase, (from, to) =>
    supabase
      .from("ledger_entries")
      .select("entity_id, entry_type, amount")
      .eq("entity_type", entityType)
      .order("id", { ascending: true })
      .range(from, to)
  );

  if (!idSet) return rows;
  return rows.filter((row) => idSet.has(row.entity_id));
}

/** Fetch full ledger rows for one entity (statements, detail views). */
export async function fetchAllLedgerRowsForEntity(
  supabase: SupabaseClient<Database>,
  entityType: LedgerEntryRow["entity_type"],
  entityId: string
): Promise<LedgerEntryRow[]> {
  return fetchLedgerPages<LedgerEntryRow>(supabase, (from, to) =>
    supabase
      .from("ledger_entries")
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("id", { ascending: true })
      .range(from, to)
  );
}

type LedgerDateFilter =
  | { kind: "lt"; date: string }
  | { kind: "lte"; date: string }
  | { kind: "range"; start: string; end: string };

/** Paginated ledger fetch with optional date filters (reports, rojmel). */
export async function fetchAllLedgerRows(
  supabase: SupabaseClient<Database>,
  options: { dateFilter?: LedgerDateFilter } = {}
): Promise<LedgerEntryRow[]> {
  return fetchLedgerPages<LedgerEntryRow>(supabase, (from, to) => {
    let query = supabase
      .from("ledger_entries")
      .select("*")
      .order("id", { ascending: true })
      .range(from, to);

    const { dateFilter } = options;
    if (dateFilter?.kind === "lt") {
      query = query.lt("entry_date", dateFilter.date);
    } else if (dateFilter?.kind === "lte") {
      query = query.lte("entry_date", dateFilter.date);
    } else if (dateFilter?.kind === "range") {
      query = query
        .gte("entry_date", dateFilter.start)
        .lte("entry_date", dateFilter.end);
    }

    return query;
  });
}