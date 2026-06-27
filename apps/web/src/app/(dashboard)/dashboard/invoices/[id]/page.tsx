import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Printer } from "lucide-react";

import { Breadcrumbs } from "@punchless/ui/components/breadcrumbs";
import { Button } from "@punchless/ui/components/button";
import { PageHeader } from "@/components/page-header";

import { getInvoiceById } from "@/lib/queries/invoice.queries";
import { formatCurrency, formatDate } from "@/lib/utils/formatting";

function calculateLineGst(amount: number, gstPercent: number) {
  return Math.round(amount * (gstPercent / 100) * 100) / 100;
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getInvoiceById(id);

  if (!invoice) notFound();

  return (
    <div className="space-y-6">
      <Breadcrumbs
        linkComponent={({ href, children: label, className }) => (
          <Link href={href} className={className}>
            {label}
          </Link>
        )}
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Invoices", href: "/dashboard/invoices" },
          {
            label: invoice.invoice_number
              ? `Invoice ${invoice.invoice_number}`
              : "Invoice",
          },
        ]}
      />

      <PageHeader
        title={
          invoice.invoice_number
            ? `Invoice ${invoice.invoice_number}`
            : "Invoice"
        }
        description={`${invoice.client_name} · ${formatDate(invoice.invoice_date)}`}
      >
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/invoices">
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/invoices?invoice=${invoice.id}`}>
              <Pencil className="size-4" />
              Edit
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={`/dashboard/invoices/${invoice.id}/print`} target="_blank">
              <Printer className="size-4" />
              Print
            </Link>
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Customer" value={invoice.client_name} />
        <SummaryCard
          label="Total"
          value={formatCurrency(invoice.total_amount)}
        />
        <SummaryCard
          label="Balance due"
          value={formatCurrency(invoice.credit_amount)}
          highlight={invoice.credit_amount > 0.01}
        />
        <SummaryCard
          label="Payment"
          value={invoice.payment_mode}
          capitalize
        />
      </div>

      <article className="rounded-xl border border-border bg-card p-6">
        <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 text-sm">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Bill To
            </p>
            <p className="font-medium">{invoice.client_name}</p>
            {invoice.client_alias ? <p>{invoice.client_alias}</p> : null}
            {invoice.client_address ? (
              <p className="text-muted-foreground">{invoice.client_address}</p>
            ) : null}
            {invoice.client_gst_number ? (
              <p>GSTIN: {invoice.client_gst_number}</p>
            ) : null}
          </div>
          <div className="space-y-1">
            {invoice.vehicle_number ? (
              <p>
                <span className="text-muted-foreground">Vehicle:</span>{" "}
                {invoice.vehicle_number}
              </p>
            ) : null}
            {invoice.job_title ? (
              <p>
                <span className="text-muted-foreground">Job:</span>{" "}
                {invoice.job_title}
              </p>
            ) : null}
            {invoice.remark ? (
              <p>
                <span className="text-muted-foreground">Remark:</span>{" "}
                {invoice.remark}
              </p>
            ) : null}
          </div>
        </div>

        <table className="mb-6 w-full text-sm">
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
                  <td className="px-3 py-2 text-right">
                    {formatCurrency(item.amount)}
                  </td>
                  <td className="px-3 py-2 text-right">{item.gst_percent}%</td>
                  <td className="px-3 py-2 text-right">
                    {formatCurrency(
                      calculateLineGst(item.amount, item.gst_percent)
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr className="border-b border-border">
                <td className="px-3 py-2">{invoice.remark || "Service"}</td>
                <td className="px-3 py-2 text-right">
                  {formatCurrency(invoice.taxable_amount)}
                </td>
                <td className="px-3 py-2 text-right">{invoice.gst_percent}%</td>
                <td className="px-3 py-2 text-right">
                  {formatCurrency(invoice.gst_amount)}
                </td>
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
            <span className="text-muted-foreground">
              GST ({invoice.gst_percent}%)
            </span>
            <span>{formatCurrency(invoice.gst_amount)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
            <span>Total</span>
            <span>{formatCurrency(invoice.total_amount)}</span>
          </div>
        </div>
      </article>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  highlight = false,
  capitalize = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  capitalize?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={`text-lg font-semibold ${highlight ? "text-warning" : ""} ${capitalize ? "capitalize" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}