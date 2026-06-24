import { getActiveClients } from "@/lib/queries/client.queries";
import { getJobs } from "@/lib/queries/job.queries";
import { getInvoices, getNextInvoiceNumber } from "@/lib/queries/invoice.queries";
import { InvoiceManager } from "./invoice-manager";

export default async function InvoicesPage() {
  const [invoices, clients, jobs, suggestedInvoiceNumber] = await Promise.all([
    getInvoices(),
    getActiveClients(),
    getJobs(),
    getNextInvoiceNumber(),
  ]);

  return (
    <InvoiceManager
      invoices={invoices}
      clients={clients}
      jobs={jobs}
      suggestedInvoiceNumber={suggestedInvoiceNumber}
    />
  );
}