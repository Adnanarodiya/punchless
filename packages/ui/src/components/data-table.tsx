"use client";

import * as React from "react";
import { Search } from "lucide-react";

import { useTablePagination } from "../hooks/use-table-pagination";
import { DEFAULT_TABLE_PAGE_SIZE } from "../lib/paginate";
import { cn } from "../lib/utils";
import { TablePagination } from "./table-pagination";

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
  emptyMessage?: React.ReactNode;
  enableSearch?: boolean;
  stickyFirstColumn?: boolean;
  className?: string;
  getRowKey: (row: T) => string;
  pageSize?: number;
  enablePagination?: boolean;
}

export function DataTable<T>({
  columns,
  data,
  searchPlaceholder = "Search…",
  searchFilter,
  emptyMessage = "No records found.",
  enableSearch = false,
  stickyFirstColumn = false,
  className,
  getRowKey,
  pageSize = DEFAULT_TABLE_PAGE_SIZE,
  enablePagination = true,
}: DataTableProps<T>) {
  const [query, setQuery] = React.useState("");

  const filteredData = React.useMemo(() => {
    if (!enableSearch || !query.trim() || !searchFilter) return data;
    return data.filter((row) => searchFilter(row, query.trim().toLowerCase()));
  }, [data, enableSearch, query, searchFilter]);

  const pagination = useTablePagination(filteredData, {
    pageSize: enablePagination ? pageSize : filteredData.length || 1,
    resetKey: query,
  });

  const rows = enablePagination ? pagination.items : filteredData;

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
              {columns.map((column, index) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                    stickyFirstColumn &&
                      index === 0 &&
                      "sticky left-0 z-[2] border-r border-border bg-muted/40",
                    column.headerClassName
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={getRowKey(row)}
                  className="group border-b border-border last:border-0 hover:bg-muted/30"
                >
                  {columns.map((column, index) => (
                    <td
                      key={column.key}
                      className={cn(
                        "px-4 py-3 text-foreground",
                        stickyFirstColumn &&
                          index === 0 &&
                          "sticky left-0 z-[1] border-r border-border bg-card group-hover:bg-muted/30",
                        column.className
                      )}
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

      {enablePagination ? (
        <TablePagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          pageSize={pagination.pageSize}
          onPageChange={pagination.setPage}
        />
      ) : null}
    </div>
  );
}