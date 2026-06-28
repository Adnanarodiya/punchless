"use client";

import { TablePagination } from "@punchless/ui/components/table-pagination";
import { useTablePagination } from "@punchless/ui/hooks/use-table-pagination";
import { DEFAULT_TABLE_PAGE_SIZE } from "@punchless/ui/lib/paginate";

interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  align?: "left" | "right";
}

interface Props<T> {
  data: T[];
  columns: Column<T>[];
  getRowKey: (row: T) => string;
  emptyMessage?: string;
  pageSize?: number;
  enablePagination?: boolean;
}

export function ReportTable<T>({
  data,
  columns,
  getRowKey,
  emptyMessage = "No data for this period.",
  pageSize = DEFAULT_TABLE_PAGE_SIZE,
  enablePagination = true,
}: Props<T>) {
  const pagination = useTablePagination(data, {
    pageSize: enablePagination ? pageSize : data.length || 1,
  });

  const rows = enablePagination ? pagination.items : data;

  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`p-3 font-medium ${col.align === "right" ? "text-right" : ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={getRowKey(row)}
                className="border-b border-border last:border-0 hover:bg-muted/40"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`p-3 ${col.align === "right" ? "text-right" : ""}`}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
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