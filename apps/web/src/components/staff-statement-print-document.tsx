import { StatementLetterhead } from "@punchless/ui/components/statement-letterhead";

import { SalarySlipDetailCard } from "@/components/salary-slip-detail-card";
import { SalarySlipSummaryTable } from "@/components/salary-slip-summary-table";
import type { CompanyProfile } from "@/lib/queries/settings.queries";
import type {
  EmployeeSalarySlipRecord,
  StaffStatementLine,
} from "@/lib/queries/staff-payment.queries";
import { formatCurrency, formatDate } from "@/lib/utils/formatting";
import {
  formatStaffLedgerTotal,
  staffPaymentInPeriod,
  staffStatementTypeLabel,
} from "@/lib/utils/staff-statement-display";

type Props = {
  company: CompanyProfile;
  employeeName: string;
  workshopName?: string | null;
  startDate: string;
  endDate: string;
  openingBalance: number;
  closingBalance: number;
  lines: StaffStatementLine[];
  salarySlips: EmployeeSalarySlipRecord[];
};

export function StaffStatementPrintDocument({
  company,
  employeeName,
  workshopName,
  startDate,
  endDate,
  openingBalance,
  closingBalance,
  lines,
  salarySlips,
}: Props) {
  const multiMonth = salarySlips.length > 1;
  const paidInPeriod = staffPaymentInPeriod(openingBalance, closingBalance);

  return (
    <div id="printMe" className="mx-auto max-w-5xl space-y-8 p-6 print:p-0">
      <StatementLetterhead
        companyName={company.name}
        tagline={company.tagline}
        address={company.address}
        phone={company.phone}
        email={company.email}
        logoUrl={company.logo_url}
      />

      <div className="space-y-1 text-center">
        <h1 className="text-xl font-bold">{employeeName} — Staff Statement</h1>
        <p className="text-sm text-muted-foreground">
          {formatDate(startDate)} to {formatDate(endDate)}
        </p>
        {workshopName ? (
          <p className="text-sm text-muted-foreground">Workshop: {workshopName}</p>
        ) : null}
      </div>

      {salarySlips.length > 0 ? (
        <section className="space-y-4 break-inside-avoid">
          <div className="space-y-1">
            <h2 className="text-lg font-bold">Salary payment summary</h2>
            <p className="text-sm text-muted-foreground">
              {multiMonth
                ? "Month-wise breakdown — same columns as the Pay Staff salary report."
                : "Full payment proof for this month."}
            </p>
          </div>

          {multiMonth ? (
            <SalarySlipSummaryTable
              rows={salarySlips.map((slip) => ({
                paymentId: slip.paymentId,
                paymentDate: slip.paymentDate,
                snapshot: slip.snapshot,
              }))}
            />
          ) : (
            <SalarySlipDetailCard snapshot={salarySlips[0]!.snapshot} />
          )}
        </section>
      ) : null}

      <section className="space-y-4 break-inside-avoid">
        <h2 className="text-lg font-bold">Payment history</h2>

        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div className="rounded-lg border border-border p-3">
            <p className="text-muted-foreground">Paid before this period</p>
            <p className="text-lg font-bold">{formatStaffLedgerTotal(openingBalance)}</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-muted-foreground">Paid in this period</p>
            <p className="text-lg font-bold">{formatCurrency(paidInPeriod)}</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-muted-foreground">Total paid by end date</p>
            <p className="text-lg font-bold">{formatStaffLedgerTotal(closingBalance)}</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-3 py-2 text-left font-medium">Date</th>
                <th className="px-3 py-2 text-left font-medium">Type</th>
                <th className="px-3 py-2 text-left font-medium">Remark</th>
                <th className="px-3 py-2 text-right font-medium">You paid</th>
                <th className="px-3 py-2 text-right font-medium">Salary owed</th>
                <th className="px-3 py-2 text-right font-medium">Total paid so far</th>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-center text-muted-foreground">
                    No entries in this date range.
                  </td>
                </tr>
              ) : (
                lines.map((row) => (
                  <tr key={row.id} className="border-b border-border">
                    <td className="px-3 py-2">{formatDate(row.entry_date)}</td>
                    <td className="px-3 py-2">{staffStatementTypeLabel(row.reference_type)}</td>
                    <td className="px-3 py-2">{row.remark ?? "—"}</td>
                    <td className="px-3 py-2 text-right">
                      {row.debit > 0 ? formatCurrency(row.debit) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {row.credit > 0 ? formatCurrency(row.credit) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      {formatStaffLedgerTotal(row.balance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}