"use client";

import * as React from "react";
import { Search } from "lucide-react";

import { cn } from "../lib/utils";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchFilter?: (row: T, query: string) => boolean;
  emptyMessage?: string;
  enableSearch?: boolean;
  className?: string;
  getRowKey: (row: T) => string;
}

export function DataTable<T>({
  columns,
  data,
  searchPlaceholder = "Search…",
  searchFilter,
  emptyMessage = "No records found.",
  enableSearch = false,
  className,
  getRowKey,
}: DataTableProps<T>) {
  const [query, setQuery] = React.useState("");

  const filteredData = React.useMemo(() => {
    if (!enableSearch || !query.trim() || !searchFilter) return data;
    return data.filter((row) => searchFilter(row, query.trim().toLowerCase()));
  }, [data, enableSearch, query, searchFilter]);

  return (
    <div data-slot="data-table" className={cn("space-y-3", className)}>
      {enableSearch && searchFilter ? (
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            aria-label="Search table"
          />
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                    column.headerClassName
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filteredData.map((row) => (
                <tr
                  key={getRowKey(row)}
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn("px-4 py-3 text-foreground", column.className)}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}