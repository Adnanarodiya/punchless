import { notFound } from "next/navigation";

import { SalarySlipPrintDocument } from "@/components/salary-slip-print-document";
import { getStaffPaymentById } from "@/lib/queries/staff-payment.queries";
import { getCompanyProfile } from "@/lib/queries/settings.queries";

import { SlipPrintActions } from "./slip-print-actions";

const TYPE_LABELS: Record<string, string> = {
  advance: "Advance paid",
  salary_paid: "Salary paid",
  deduction: "Deduction",
};

export default async function StaffPaymentSlipPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [payment, company] = await Promise.all([
    getStaffPaymentById(id),
    getCompanyProfile(),
  ]);

  if (!payment || !company) notFound();

  if (!payment.slip_snapshot) {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-6">
        <SlipPrintActions backHref="/dashboard/salary?tab=history" />
        <p className="text-sm text-muted-foreground">
          No printable slip was saved for this payment. Only salary payments recorded after the
          slip feature was enabled include a PDF-ready statement.
        </p>
      </div>
    );
  }

  return (
    <div className="pb-8">
      <SlipPrintActions backHref="/dashboard/salary?tab=history" />
      <SalarySlipPrintDocument
        company={company}
        snapshot={payment.slip_snapshot}
        paymentTypeLabel={TYPE_LABELS[payment.payment_type] ?? "Payment"}
      />
    </div>
  );
}