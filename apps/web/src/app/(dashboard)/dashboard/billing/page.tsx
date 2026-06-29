import Link from "next/link";
import { CreditCard } from "lucide-react";

import { Button } from "@punchless/ui/components/button";
import { DashboardPageHeader } from "@/components/dashboard-page-header";
import { InfoHint } from "@/components/info-hint";
import { TableEmptyState } from "@/components/table-empty-state";
import { redirectUnlessFullDashboard } from "@/lib/utils/dashboard-experience-guard";

export default async function BillingPage() {
  await redirectUnlessFullDashboard("/dashboard/settings");

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Billing"
        description="Subscription and plan management — coming in a future release."
      />
      <InfoHint title="Not available yet">
        Billing is not connected yet. Your workshop can use the full dashboard without a
        subscription payment flow for now.
      </InfoHint>
      <div className="rounded-xl border border-border bg-card">
        <TableEmptyState
          icon={CreditCard}
          title="Billing is not set up"
          description="Stripe subscriptions are planned for a later phase. Everything else — attendance, payroll, customers, and reports — works without billing today."
          action={
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/settings">Open settings</Link>
            </Button>
          }
        />
      </div>
    </div>
  );
}