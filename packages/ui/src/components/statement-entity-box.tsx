import { cn } from "../lib/utils";
import { formatStatementDate } from "./statement-format";

export interface StatementEntityBoxProps {
  title?: string;
  lines: { label: string; value: string }[];
  startDate: string;
  endDate: string;
  className?: string;
  /** INCOME / EXPENSE — full-width compact bar */
  variant?: "party" | "system";
}

export function StatementEntityBox({
  title = "Statement To",
  lines,
  startDate,
  endDate,
  className,
  variant = "party",
}: StatementEntityBoxProps) {
  const periodLabel = `${formatStatementDate(startDate)} — ${formatStatementDate(endDate)}`;
  const isSystem = variant === "system";

  return (
    <div
      data-slot="statement-entity-box"
      className={cn(
        "rounded-lg border-2 border-dashed border-success text-sm",
        isSystem
          ? "w-full px-4 py-3"
          : "ml-auto w-full max-w-md p-4",
        className
      )}
    >
      {isSystem ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:items-center sm:gap-4">
          <p className="font-semibold text-foreground">{title}</p>
          {lines.map((line) => (
            <p key={line.label} className="text-muted-foreground">
              <span className="font-semibold text-foreground">{line.label}:</span>{" "}
              {line.value}
            </p>
          ))}
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground">Period:</span>{" "}
            {periodLabel}
          </p>
        </div>
      ) : (
        <>
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
              <span className="text-muted-foreground">{periodLabel}</span>
            </p>
          </div>
        </>
      )}
    </div>
  );
}