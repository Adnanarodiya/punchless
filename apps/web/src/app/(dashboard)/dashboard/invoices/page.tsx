import { redirect } from "next/navigation";
import { Suspense } from "react";

import { getActiveClients } from "@/lib/queries/client.queries";
import { getJobs } from "@/lib/queries/job.queries";
import { getInvoices, getNextInvoiceNumber } from "@/lib/queries/invoice.queries";
import { getCompanySettings } from "@/lib/queries/settings.queries";
import { InvoiceManager } from "./invoice-manager";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const [params, settings] = await Promise.all([
    searchParams,
    getCompanySettings(),
  ]);

  if (settings?.dashboard_experience !== "full") {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) qs.set(key, value);
    }
    qs.set("tab", "bills");
    const query = qs.toString();
    redirect(query ? `/dashboard/customers?${query}` : "/dashboard/customers?tab=bills");
  }

  const [invoices, clients, jobs, suggestedInvoiceNumber] = await Promise.all([
    getInvoices(),
    getActiveClients(),
    getJobs(),
    getNextInvoiceNumber(),
  ]);

  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading invoices…</div>}>
      <InvoiceManager
        invoices={invoices}
        clients={clients}
        jobs={jobs}
        suggestedInvoiceNumber={suggestedInvoiceNumber}
      />
    </Suspense>
  );
}