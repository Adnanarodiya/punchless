import { DashboardPageTitle } from "@/components/dashboard-page-title";

export default function BillingPage() {
  return (
    <div>
      <DashboardPageTitle title="Billing" />
      <div className="bg-card border border-border rounded-xl p-6">
        <p className="text-muted-foreground">
          Billing management will be built in upcoming phases.
        </p>
      </div>
    </div>
  );
}
