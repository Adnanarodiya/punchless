import { Building2, FileText, IndianRupee } from "lucide-react";

import { FlowStepPanel } from "./flow-step-panel";

/** Customer receivables path — shown on the Customers page. */
export function CommerceFlowPanel({ className }: { className?: string }) {
  return (
    <FlowStepPanel
      headingId="commerce-flow-heading"
      title="Customer money flow"
      description="Add customer → bill → collect payment → view statement on the customer row."
      className={className}
      steps={[
        {
          step: 1,
          label: "Add customer",
          hint: "Opening balance if they already owe you",
          icon: Building2,
          current: true,
        },
        {
          step: 2,
          label: "New bill",
          hint: "Sales bill — posts to customer ledger",
          icon: FileText,
          href: "/dashboard?quickBill=1",
        },
        {
          step: 3,
          label: "Collect payment",
          hint: "Home modal or ₹ on each customer row",
          icon: IndianRupee,
          href: "/dashboard?collectPayment=1",
        },
        {
          step: 4,
          label: "Statement",
          hint: "Icon on each customer row",
          icon: FileText,
        },
      ]}
    />
  );
}