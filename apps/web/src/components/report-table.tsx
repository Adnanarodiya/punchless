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
}

export function ReportTable<T>({
  data,
  columns,
  getRowKey,
  emptyMessage = "No data for this period.",
}: Props<T>) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
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
          {data.map((row) => (
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
  );
}