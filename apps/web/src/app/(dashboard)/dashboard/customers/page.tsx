import { getClients, getClientsSummary, getActiveClients } from "@/lib/queries/client.queries";
import { getInvoices, getNextInvoiceNumber } from "@/lib/queries/invoice.queries";
import { getJobs } from "@/lib/queries/job.queries";
import { getCompanySettings } from "@/lib/queries/settings.queries";
import { CommerceFlowPanel } from "@/components/commerce-flow-panel";
import { CustomerManager } from "./customer-manager";
import { CustomerCommerceHub, type CustomerCommerceTab } from "./customer-commerce-hub";

const VALID_TABS = new Set<CustomerCommerceTab>(["customers", "new-bill", "bills"]);

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{
    customer?: string;
    client?: string;
    open?: string;
    tab?: string;
  }>;
}) {
  const params = await searchParams;
  const customerId = params.customer ?? params.client;
  const settings = await getCompanySettings();
  const isSimple = settings?.dashboard_experience !== "full";
  const tabParam = params.tab as CustomerCommerceTab | undefined;
  const initialTab =
    tabParam && VALID_TABS.has(tabParam) ? tabParam : "customers";

  if (isSimple) {
    const [customers, summary, invoices, invoiceClients, jobs, suggestedInvoiceNumber] =
      await Promise.all([
        getClients({ includeDeleted: true }),
        getClientsSummary(),
        getInvoices(),
        getActiveClients(),
        getJobs(),
        getNextInvoiceNumber(),
      ]);

    return (
      <CustomerCommerceHub
        customers={customers}
        summary={summary}
        invoices={invoices}
        invoiceClients={invoiceClients}
        jobs={jobs}
        suggestedInvoiceNumber={suggestedInvoiceNumber}
        initialCustomerId={customerId}
        initialOpen={
          params.open === "pay" || params.open === "invoice" ? params.open : undefined
        }
        initialTab={initialTab}
      />
    );
  }

  const [customers, summary] = await Promise.all([
    getClients({ includeDeleted: true }),
    getClientsSummary(),
  ]);

  return (
    <div className="space-y-6">
      <CommerceFlowPanel />
      <CustomerManager
        customers={customers}
        summary={summary}
        initialCustomerId={customerId}
        initialOpen={
          params.open === "pay" || params.open === "invoice" ? params.open : undefined
        }
      />
    </div>
  );
}