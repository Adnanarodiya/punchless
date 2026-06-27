import { FileText, IndianRupee, ShoppingCart, Truck } from "lucide-react";

import { FlowStepPanel } from "./flow-step-panel";

/** Supplier payables path — shown on the Suppliers page. */
export function SupplierFlowPanel({ className }: { className?: string }) {
  return (
    <FlowStepPanel
      headingId="supplier-flow-heading"
      title="Supplier money flow"
      description="Add supplier → supplier bill → pay supplier → view statement on the supplier row."
      className={className}
      steps={[
        {
          step: 1,
          label: "Add supplier",
          hint: "Opening balance if you already owe them",
          icon: Truck,
          current: true,
        },
        {
          step: 2,
          label: "Supplier bill",
          hint: "Record what you bought on credit",
          icon: ShoppingCart,
          href: "/dashboard/purchases",
        },
        {
          step: 3,
          label: "Pay supplier",
          hint: "₹ button on each supplier row",
          icon: IndianRupee,
        },
        {
          step: 4,
          label: "Statement",
          hint: "Icon on each supplier row",
          icon: FileText,
        },
      ]}
    />
  );
}