import { cn } from "../lib/utils";
import { formatStatementDate } from "./statement-format";

export interface StatementEntityBoxProps {
  title?: string;
  lines: { label: string; value: string }[];
  startDate: string;
  endDate: string;
  className?: string;
}

export function StatementEntityBox({
  title = "Statement To",
  lines,
  startDate,
  endDate,
  className,
}: StatementEntityBoxProps) {
  return (
    <div
      data-slot="statement-entity-box"
      className={cn(
        "ml-auto w-full max-w-md rounded-lg border-2 border-dashed border-success p-4 text-sm",
        className
      )}
    >
      <p className="mb-2 font-semibold text-foreground">{title}</p>
      <div className="space-y-1">
        {lines.map((line) => (
          <p key={line.label}>
            <span className="font-semibold">{line.label}:</span>{" "}
            <span className="text-muted-foreground">{line.value}</span>
          </p>
        ))}
        <p>
          <span className="font-semibold">Period:</span>{" "}
          <span className="text-muted-foreground">
            {formatStatementDate(startDate)} — {formatStatementDate(endDate)}
          </span>
        </p>
      </div>
    </div>
  );
}