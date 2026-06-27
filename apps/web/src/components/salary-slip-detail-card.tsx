import type { StaffPaymentSlipSnapshot } from "@/lib/types/staff-payment-slip";
import {
  buildSalarySlipExplanation,
  normalizeSlipSnapshot,
} from "@/lib/utils/staff-payment-slip";
import { formatCurrency, formatDate, formatMonthYear } from "@/lib/utils/formatting";
import { cn } from "@punchless/ui/lib/utils";

type Props = {
  snapshot: StaffPaymentSlipSnapshot;
  paymentTypeLabel?: string;
  className?: string;
  compact?: boolean;
};

export function SalarySlipDetailCard({
  snapshot: raw,
  paymentTypeLabel = "Salary paid",
  className,
  compact = false,
}: Props) {
  const snapshot = normalizeSlipSnapshot(raw);
  const monthLabel = formatMonthYear(snapshot.salaryMonth);
  const explanation = buildSalarySlipExplanation(snapshot);

  const perDayEarned =
    snapshot.eligibleDays > 0
      ? Math.round(snapshot.monthlySalary / snapshot.eligibleDays)
      : 0;

  return (
    <article
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-card",
        className
      )}
    >
      <header className="border-b border-border bg-muted/30 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-bold">{snapshot.employeeName}</h2>
            <p className="text-sm text-muted-foreground">
              Salary proof — {monthLabel}
              {snapshot.designation ? ` · ${snapshot.designation}` : ""}
            </p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold text-success">
              {formatCurrency(snapshot.amountPaid)} paid
            </p>
            <p className="text-muted-foreground">
              {formatDate(snapshot.paymentDate)}
              {snapshot.paymentMode ? ` · ${snapshot.paymentMode}` : ""}
            </p>
          </div>
        </div>
      </header>

      <div className={cn("space-y-4 p-4 sm:p-5", compact && "text-sm")}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Fixed salary" value={formatCurrency(snapshot.monthlySalary)} />
          <Stat label="Working days" value={String(snapshot.workingDays)} />
          <Stat
            label="Absent days"
            value={snapshot.absentDays > 0 ? String(snapshot.absentDays) : "0"}
            highlight={snapshot.absentDays > 0}
          />
          <Stat label="Eligible days" value={String(snapshot.eligibleDays)} />
        </div>

        <table className="w-full text-sm">
          <tbody>
            <SlipRow
              label={`Earned salary (${snapshot.workingDays} ÷ ${snapshot.eligibleDays} days × ${formatCurrency(snapshot.monthlySalary)})`}
              value={formatCurrency(snapshot.earnedSalary)}
            />
            {snapshot.otPay > 0 ? (
              <SlipRow
                label={`OT pay (${snapshot.otHours.toFixed(2)} hrs @ ${snapshot.otRateMultiplier}×, ~${formatCurrency(perDayEarned)}/day base)`}
                value={formatCurrency(snapshot.otPay)}
              />
            ) : null}
            <SlipRow label="Total salary" value={formatCurrency(snapshot.totalSalary)} bold />
            {snapshot.advanceDeduction > 0 ? (
              <SlipRow
                label="Advance deducted (Upad)"
                value={`−${formatCurrency(snapshot.advanceDeduction)}`}
                destructive
              />
            ) : null}
            {snapshot.alreadyPaidBefore > 0 ? (
              <SlipRow
                label="Already paid earlier this month"
                value={`−${formatCurrency(snapshot.alreadyPaidBefore)}`}
              />
            ) : null}
            <SlipRow label="Net payable" value={formatCurrency(snapshot.netPayment)} bold />
            <SlipRow
              label={`${paymentTypeLabel} on ${formatDate(snapshot.paymentDate)}`}
              value={formatCurrency(snapshot.amountPaid)}
              success
              bold
            />
          </tbody>
        </table>

        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm leading-relaxed">
          <p className="mb-1 font-medium text-foreground">Why this amount?</p>
          <p className="text-muted-foreground">{explanation}</p>
        </div>

        {snapshot.remark ? (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Remark:</span> {snapshot.remark}
          </p>
        ) : null}

        {!compact ? (
          <div className="grid grid-cols-2 gap-6 pt-2 text-sm">
            <div className="border-t border-border pt-2">
              <p className="text-muted-foreground">Staff signature</p>
            </div>
            <div className="border-t border-border pt-2">
              <p className="text-muted-foreground">Staff thumb</p>
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-lg font-bold", highlight && "text-warning")}>{value}</p>
    </div>
  );
}

function SlipRow({
  label,
  value,
  bold,
  destructive,
  success,
}: {
  label: string;
  value: string;
  bold?: boolean;
  destructive?: boolean;
  success?: boolean;
}) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className={cn("py-2 pr-4", bold && "font-semibold")}>{label}</td>
      <td
        className={cn(
          "py-2 text-right tabular-nums",
          bold && "font-semibold",
          destructive && "text-destructive",
          success && "text-success"
        )}
      >
        {value}
      </td>
    </tr>
  );
}