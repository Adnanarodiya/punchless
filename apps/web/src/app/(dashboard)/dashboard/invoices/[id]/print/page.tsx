import { notFound } from "next/navigation";

import { getInvoiceById } from "@/lib/queries/invoice.queries";
import { PrintActions } from "./print-actions";
import { getCurrentUser } from "@/lib/queries/auth.queries";
import { formatCurrency, formatDate } from "@/lib/utils/formatting";

function calculateLineGst(amount: number, gstPercent: number) {
  return Math.round(amount * (gstPercent / 100) * 100) / 100;
}

export default async function InvoicePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [invoice, user] = await Promise.all([
    getInvoiceById(id),
    getCurrentUser(),
  ]);

  if (!invoice) notFound();

  const companyName = user?.company?.name ?? "Punchless";

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 print:p-0">
      <PrintActions />

      <article className="rounded-xl border border-border bg-card p-8 print:border-0 print:shadow-none">
        <header className="mb-8 border-b border-border pb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{companyName}</h1>
              <p className="mt-1 text-sm text-muted-foreground">Tax Invoice</p>
            </div>
            <div className="text-right text-sm">
              <p className="font-semibold">
                {invoice.invoice_number ? `#${invoice.invoice_number}` : "Draft"}
              </p>
              <p className="text-muted-foreground">{formatDate(invoice.invoice_date)}</p>
            </div>
          </div>
        </header>

        <section className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 text-sm">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bill To</p>
            <p className="font-medium">{invoice.client_name}</p>
            {invoice.client_alias ? <p>{invoice.client_alias}</p> : null}
            {invoice.client_address ? <p className="text-muted-foreground">{invoice.client_address}</p> : null}
            {invoice.client_gst_number ? <p>GSTIN: {invoice.client_gst_number}</p> : null}
          </div>
          <div>
            {invoice.vehicle_number ? (
              <p><span className="text-muted-foreground">Vehicle:</span> {invoice.vehicle_number}</p>
            ) : null}
            {invoice.job_title ? (
              <p><span className="text-muted-foreground">Job:</span> {invoice.job_title}</p>
            ) : null}
          </div>
        </section>

        <table className="mb-8 w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-3 py-2 text-left">Description</th>
              <th className="px-3 py-2 text-right">Amount</th>
              <th className="px-3 py-2 text-right">GST %</th>
              <th className="px-3 py-2 text-right">GST</th>
            </tr>
          </thead>
          <tbody>
            {invoice.line_items.length > 0 ? (
              invoice.line_items.map((item) => (
                <tr key={item.id} className="border-b border-border">
                  <td className="px-3 py-2">{item.description}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(item.amount)}</td>
                  <td className="px-3 py-2 text-right">{item.gst_percent}%</td>
                  <td className="px-3 py-2 text-right">
                    {formatCurrency(calculateLineGst(item.amount, item.gst_percent))}
                  </td>
                </tr>
              ))
            ) : (
              <tr className="border-b border-border">
                <td className="px-3 py-2">{invoice.remark || "Service"}</td>
                <td className="px-3 py-2 text-right">{formatCurrency(invoice.taxable_amount)}</td>
                <td className="px-3 py-2 text-right">{invoice.gst_percent}%</td>
                <td className="px-3 py-2 text-right">{formatCurrency(invoice.gst_amount)}</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="ml-auto max-w-xs space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Taxable</span>
            <span>{formatCurrency(invoice.taxable_amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">GST ({invoice.gst_percent}%)</span>
            <span>{formatCurrency(invoice.gst_amount)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
            <span>Total</span>
            <span>{formatCurrency(invoice.total_amount)}</span>
          </div>
        </div>

        {invoice.remark ? (
          <section className="mb-6 rounded-lg border border-border bg-muted/20 p-4 text-sm">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Remark
            </p>
            <p className="whitespace-pre-wrap">{invoice.remark}</p>
          </section>
        ) : null}

        <section className="mt-8 rounded-lg border border-border p-4 text-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Payment Summary
          </p>
          <div className="space-y-2">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Mode</span>
              <span className="font-medium capitalize">{invoice.payment_mode}</span>
            </div>
            {invoice.cash_amount > 0 ? (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Cash received</span>
                <span className="font-medium">{formatCurrency(invoice.cash_amount)}</span>
              </div>
            ) : null}
            {invoice.bank_amount > 0 ? (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Bank received</span>
                <span className="font-medium">{formatCurrency(invoice.bank_amount)}</span>
              </div>
            ) : null}
            {invoice.credit_amount > 0.01 ? (
              <div className="flex justify-between gap-4 rounded-md border border-warning/30 bg-warning/10 px-3 py-2">
                <span className="font-medium text-warning">Balance due (pending)</span>
                <span className="font-semibold text-warning">
                  {formatCurrency(invoice.credit_amount)}
                </span>
              </div>
            ) : (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Balance due</span>
                <span className="font-medium">{formatCurrency(0)}</span>
              </div>
            )}
          </div>
        </section>
      </article>


    </div>
  );
}