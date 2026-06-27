import { StatementLetterhead } from "@punchless/ui/components/statement-letterhead";

import { SalarySlipDetailCard } from "@/components/salary-slip-detail-card";
import type { CompanyProfile } from "@/lib/queries/settings.queries";
import type { StaffPaymentSlipSnapshot } from "@/lib/types/staff-payment-slip";

type Props = {
  company: CompanyProfile;
  snapshot: StaffPaymentSlipSnapshot;
  paymentTypeLabel?: string;
};

export function SalarySlipPrintDocument({
  company,
  snapshot,
  paymentTypeLabel = "Salary paid",
}: Props) {
  return (
    <div id="printMe" className="mx-auto max-w-3xl space-y-6 p-6 print:p-0">
      <StatementLetterhead
        companyName={company.name}
        tagline={company.tagline}
        address={company.address}
        phone={company.phone}
        email={company.email}
        logoUrl={company.logo_url}
      />

      <SalarySlipDetailCard snapshot={snapshot} paymentTypeLabel={paymentTypeLabel} />

      <p className="text-center text-xs text-muted-foreground print:hidden">
        Use Print → Save as PDF to keep a copy for your records.
      </p>
    </div>
  );
}