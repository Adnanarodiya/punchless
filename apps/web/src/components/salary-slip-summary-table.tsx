import type { StaffPaymentSlipSnapshot } from "@/lib/types/staff-payment-slip";
import { normalizeSlipSnapshot } from "@/lib/utils/staff-payment-slip";
import { formatCurrency, formatDate, formatMonthYear } from "@/lib/utils/formatting";
import { cn } from "@punchless/ui/lib/utils";

export type SalarySlipSummaryRow = {
  paymentId: string;
  paymentDate: string;
  snapshot: StaffPaymentSlipSnapshot;
};

type Props = {
  rows: SalarySlipSummaryRow[];
  className?: string;
  showPaymentDate?: boolean;
};

export function SalarySlipSummaryTable({
  rows,
  className,
  showPaymentDate = true,
}: Props) {
  if (rows.length === 0) return null;

  const normalized = rows.map((row) => ({
    ...row,
    snapshot: normalizeSlipSnapshot(row.snapshot),
  }));

  const totals = normalized.reduce(
    (acc, { snapshot }) => ({
      earned: acc.earned + snapshot.earnedSalary,
      otPay: acc.otPay + snapshot.otPay,
      total: acc.total + snapshot.totalSalary,
      advance: acc.advance + snapshot.advanceDeduction,
      net: acc.net + snapshot.netPayment,
      paid: acc.paid + snapshot.amountPaid,
    }),
    { earned: 0, otPay: 0, total: 0, advance: 0, net: 0, paid: 0 }
  );

  return (
    <div className={cn("overflow-hidden rounded-lg border border-border", className)}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left">
            <th className="px-3 py-2 font-medium">Month</th>
            <th className="px-3 py-2 text-right font-medium">Salary</th>
            <th className="px-3 py-2 text-right font-medium">Working Days</th>
            <th className="px-3 py-2 text-right font-medium">Absent</th>
            <th className="px-3 py-2 text-right font-medium">OT (hrs)</th>
            <th className="px-3 py-2 text-right font-medium">Earned</th>
            <th className="px-3 py-2 text-right font-medium">OT pay</th>
            <th className="px-3 py-2 text-right font-medium">Total</th>
            <th className="px-3 py-2 text-right font-medium text-destructive">Advance</th>
            <th className="px-3 py-2 text-right font-medium">Net pay</th>
            {showPaymentDate ? (
              <th className="px-3 py-2 text-right font-medium">Paid</th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {normalized.map(({ paymentId, paymentDate, snapshot }) => (
            <tr key={paymentId} className="border-b border-border last:border-0">
              <td className="px-3 py-2 font-medium">
                {formatMonthYear(snapshot.salaryMonth)}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {formatCurrency(snapshot.monthlySalary)}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{snapshot.workingDays}</td>
              <td className="px-3 py-2 text-right tabular-nums">
                {snapshot.absentDays > 0 ? snapshot.absentDays : "—"}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {snapshot.otHours > 0 ? snapshot.otHours.toFixed(2) : "—"}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {formatCurrency(snapshot.earnedSalary)}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {snapshot.otPay > 0 ? formatCurrency(snapshot.otPay) : "—"}
              </td>
              <td className="px-3 py-2 text-right tabular-nums font-medium">
                {formatCurrency(snapshot.totalSalary)}
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-destructive">
                {snapshot.advanceDeduction > 0
                  ? formatCurrency(snapshot.advanceDeduction)
                  : "—"}
              </td>
              <td className="px-3 py-2 text-right tabular-nums font-medium">
                {formatCurrency(snapshot.netPayment)}
              </td>
              {showPaymentDate ? (
                <td className="px-3 py-2 text-right tabular-nums text-success">
                  <span className="block font-medium">
                    {formatCurrency(snapshot.amountPaid)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(paymentDate)}
                  </span>
                </td>
              ) : null}
            </tr>
          ))}
          {normalized.length > 1 ? (
            <tr className="border-t-2 border-border bg-muted/20 font-semibold">
              <td className="px-3 py-2">Total</td>
              <td className="px-3 py-2 text-right">—</td>
              <td className="px-3 py-2 text-right">—</td>
              <td className="px-3 py-2 text-right">—</td>
              <td className="px-3 py-2 text-right">—</td>
              <td className="px-3 py-2 text-right tabular-nums">
                {formatCurrency(totals.earned)}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {totals.otPay > 0 ? formatCurrency(totals.otPay) : "—"}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {formatCurrency(totals.total)}
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-destructive">
                {totals.advance > 0 ? formatCurrency(totals.advance) : "—"}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {formatCurrency(totals.net)}
              </td>
              {showPaymentDate ? (
                <td className="px-3 py-2 text-right tabular-nums text-success">
                  {formatCurrency(totals.paid)}
                </td>
              ) : null}
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}