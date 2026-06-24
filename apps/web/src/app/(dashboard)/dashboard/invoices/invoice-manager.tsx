"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, X, Pencil, Trash2, Printer } from "lucide-react";

import { Button } from "@punchless/ui/components/button";
import { PageHeader } from "@punchless/ui/components/page-header";
import { DataTable } from "@punchless/ui/components/data-table";
import {
  createInvoice,
  updateInvoice,
  softDeleteInvoice,
} from "@/lib/actions/invoice.actions";
import {
  calculateGstAmount,
  calculatePurchaseTotal,
} from "@/lib/validations/purchase.schema";
import {
  calculateInvoiceDueEffect,
  resolvePaymentBreakdown,
} from "@/lib/validations/invoice.schema";
import type { InvoiceWithDetails } from "@/lib/queries/invoice.queries";
import type { ClientWithDue } from "@/lib/queries/client.queries";
import type { JobWithDetails } from "@/lib/queries/job.queries";
import { formatCurrency, formatDate } from "@/lib/utils/formatting";
import { useAction, toastAction } from "@/hooks/use-action";

const GST_SLABS = [0, 5, 12, 18, 28] as const;

type PaymentMode = "cash" | "bank" | "credit" | "split";

interface Props {
  invoices: InvoiceWithDetails[];
  clients: ClientWithDue[];
  jobs: JobWithDetails[];
  suggestedInvoiceNumber: string;
}

const PAYMENT_MODE_LABELS: Record<PaymentMode, string> = {
  cash: "Cash",
  bank: "Bank",
  credit: "Credit",
  split: "Split",
};

export function InvoiceManager({
  invoices,
  clients,
  jobs,
  suggestedInvoiceNumber,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] =
    useState<InvoiceWithDetails | null>(null);
  const [taxableAmount, setTaxableAmount] = useState("");
  const [gstPercent, setGstPercent] = useState("18");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("credit");
  const [cashAmount, setCashAmount] = useState("");
  const [bankAmount, setBankAmount] = useState("");

  const preview = useMemo(() => {
    const taxable = parseFloat(taxableAmount) || 0;
    const gst = parseFloat(gstPercent) || 0;
    const gstAmount = calculateGstAmount(taxable, gst);
    const total = calculatePurchaseTotal(taxable, gst);
    const cash = parseFloat(cashAmount) || 0;
    const bank = parseFloat(bankAmount) || 0;
    const breakdown = resolvePaymentBreakdown(
      paymentMode,
      taxable,
      gst,
      cash,
      bank
    );
    const dueEffect = calculateInvoiceDueEffect(
      total,
      breakdown.cashAmount,
      breakdown.bankAmount
    );
    const excessPayment =
      paymentMode === "split" && dueEffect < 0 ? Math.abs(dueEffect) : 0;
    return { gstAmount, total, breakdown, dueEffect, excessPayment };
  }, [taxableAmount, gstPercent, paymentMode, cashAmount, bankAmount]);

  const { execute: execCreate } = useAction(createInvoice, {
    successMessage: "Tax invoice created!",
    onSuccess: () => {
      setShowForm(false);
      resetForm();
    },
  });

  const { execute: execUpdate } = useAction(updateInvoice, {
    successMessage: "Invoice updated!",
    onSuccess: () => {
      setShowForm(false);
      setEditingInvoice(null);
      resetForm();
    },
  });

  function resetForm() {
    setTaxableAmount("");
    setGstPercent("18");
    setPaymentMode("credit");
    setCashAmount("");
    setBankAmount("");
  }

  function openAdd() {
    setEditingInvoice(null);
    resetForm();
    setShowForm(true);
  }

  function openEdit(invoice: InvoiceWithDetails) {
    setEditingInvoice(invoice);
    setTaxableAmount(String(invoice.taxable_amount));
    setGstPercent(String(invoice.gst_percent));
    setPaymentMode(invoice.payment_mode as PaymentMode);
    setCashAmount(String(invoice.cash_amount));
    setBankAmount(String(invoice.bank_amount));
    setShowForm(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tax Invoices"
        description="GST tax invoices for clients — cash, bank, credit, or split payment."
      >
        <Button onClick={openAdd}>
          <Plus className="size-4" /> New Invoice
        </Button>
      </PageHeader>

      {showForm ? (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {editingInvoice ? "Edit Tax Invoice" : "New Tax Invoice"}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => { setShowForm(false); setEditingInvoice(null); }}>
              <X className="size-4" />
            </Button>
          </div>

          <form
            action={editingInvoice
              ? async (fd) => { fd.set("invoiceId", editingInvoice.id); await execUpdate(fd); }
              : execCreate}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            <div>
              <label htmlFor="clientId" className="mb-1 block text-sm font-medium">Client</label>
              <select id="clientId" name="clientId" required defaultValue={editingInvoice?.client_id ?? ""}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
                <option value="" disabled>Select client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}{c.alias ? ` (${c.alias})` : ""}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="jobId" className="mb-1 block text-sm font-medium">Link to Job (optional)</label>
              <select id="jobId" name="jobId" defaultValue={editingInvoice?.job_id ?? ""}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
                <option value="">None</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>{j.title}{j.customer_name ? ` — ${j.customer_name}` : ""}</option>
                ))}
              </select>
            </div>

            <Field label="Invoice Number" name="invoiceNumber" defaultValue={editingInvoice?.invoice_number ?? suggestedInvoiceNumber} />
            <Field label="Invoice Date" name="invoiceDate" type="date" required defaultValue={editingInvoice?.invoice_date ?? new Date().toISOString().slice(0, 10)} />
            <Field label="Vehicle Number" name="vehicleNumber" defaultValue={editingInvoice?.vehicle_number ?? ""} />
            <Field label="Description / Particulars" name="description" required defaultValue={editingInvoice?.line_items[0]?.description ?? editingInvoice?.remark ?? ""} className="md:col-span-2" />

            <div>
              <label htmlFor="taxableAmount" className="mb-1 block text-sm font-medium">Taxable Amount (₹)</label>
              <input id="taxableAmount" name="taxableAmount" type="number" min="0.01" step="0.01" required
                value={taxableAmount} onChange={(e) => setTaxableAmount(e.target.value)}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" />
            </div>

            <div>
              <label htmlFor="gstPercent" className="mb-1 block text-sm font-medium">GST Slab (%)</label>
              <select id="gstPercent" name="gstPercent" required value={gstPercent} onChange={(e) => setGstPercent(e.target.value)}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
                {GST_SLABS.map((slab) => <option key={slab} value={slab}>{slab}%</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="paymentMode" className="mb-1 block text-sm font-medium">Payment Mode</label>
              <select id="paymentMode" name="paymentMode" required value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
                <option value="cash">Cash (full)</option>
                <option value="bank">Bank (full)</option>
                <option value="credit">Credit (full due)</option>
                <option value="split">Split (Cash + Bank — can exceed invoice to clear older dues)</option>
              </select>
            </div>

            {paymentMode === "split" ? (
              <>
                <div>
                  <label htmlFor="cashAmount" className="mb-1 block text-sm font-medium">Cash Amount (₹)</label>
                  <input id="cashAmount" name="cashAmount" type="number" min="0" step="0.01" value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" />
                </div>
                <div>
                  <label htmlFor="bankAmount" className="mb-1 block text-sm font-medium">Bank Amount (₹)</label>
                  <input id="bankAmount" name="bankAmount" type="number" min="0" step="0.01" value={bankAmount}
                    onChange={(e) => setBankAmount(e.target.value)}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" />
                </div>
              </>
            ) : (
              <>
                <input type="hidden" name="cashAmount" value="0" />
                <input type="hidden" name="bankAmount" value="0" />
              </>
            )}

            <Field label="Remark" name="remark" defaultValue={editingInvoice?.remark ?? ""} className="md:col-span-2" />

            <div className="rounded-lg border border-border bg-muted/30 p-4 md:col-span-2">
              <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                <p>GST: <span className="font-medium">{formatCurrency(preview.gstAmount)}</span></p>
                <p>Total: <span className="font-medium">{formatCurrency(preview.total)}</span></p>
                <p>Cash: <span className="font-medium">{formatCurrency(preview.breakdown.cashAmount)}</span></p>
                <p>Bank: <span className="font-medium">{formatCurrency(preview.breakdown.bankAmount)}</span></p>
                <p className="sm:col-span-2">
                  Credit (this invoice):{" "}
                  <span className="font-medium">
                    {formatCurrency(preview.breakdown.creditAmount)}
                  </span>
                </p>
                {preview.excessPayment > 0 ? (
                  <p className="text-success sm:col-span-2">
                    Excess payment (clears older dues):{" "}
                    <span className="font-medium">
                      {formatCurrency(preview.excessPayment)}
                    </span>
                  </p>
                ) : null}
                <p className="sm:col-span-2">
                  Net due change:{" "}
                  <span className="font-medium">
                    {preview.dueEffect <= 0
                      ? `−${formatCurrency(Math.abs(preview.dueEffect))}`
                      : `+${formatCurrency(preview.dueEffect)}`}
                  </span>
                </p>
              </div>
            </div>

            <div className="md:col-span-2">
              <Button type="submit">{editingInvoice ? "Save Changes" : "Create Invoice"}</Button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-card p-5">
        <DataTable
          data={invoices}
          getRowKey={(row) => row.id}
          enableSearch
          searchPlaceholder="Search invoices…"
          searchFilter={(row, query) =>
            [row.client_name, row.invoice_number, row.vehicle_number, row.payment_mode]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(query)
          }
          emptyMessage="No tax invoices yet."
          columns={[
            {
              key: "client",
              header: "Client",
              cell: (row) => (
                <div>
                  <p className="font-medium">{row.client_name}</p>
                  {row.invoice_number ? <p className="text-xs text-muted-foreground">#{row.invoice_number}</p> : null}
                </div>
              ),
            },
            { key: "date", header: "Date", cell: (row) => formatDate(row.invoice_date) },
            { key: "vehicle", header: "Vehicle", cell: (row) => row.vehicle_number || "—" },
            {
              key: "total",
              header: "Total",
              cell: (row) => <span className="font-medium">{formatCurrency(row.total_amount)}</span>,
            },
            {
              key: "payment",
              header: "Payment",
              cell: (row) => (
                <div className="text-xs">
                  <p className="font-medium capitalize">{PAYMENT_MODE_LABELS[row.payment_mode as PaymentMode] ?? row.payment_mode}</p>
                  <p className="text-muted-foreground">
                    {row.cash_amount > 0 ? `C ${formatCurrency(row.cash_amount)} ` : ""}
                    {row.bank_amount > 0 ? `B ${formatCurrency(row.bank_amount)} ` : ""}
                    {row.credit_amount > 0 ? `Cr ${formatCurrency(row.credit_amount)}` : ""}
                  </p>
                </div>
              ),
            },
            {
              key: "actions",
              header: "Actions",
              cell: (row) => (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" asChild title="Print">
                    <Link href={`/dashboard/invoices/${row.id}/print`} target="_blank">
                      <Printer className="size-3.5" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(row)} title="Edit">
                    <Pencil className="size-3.5" />
                  </Button>
                  <form action={toastAction(softDeleteInvoice, "Invoice deleted")}>
                    <input type="hidden" name="invoiceId" value={row.id} />
                    <Button variant="ghost" size="sm" type="submit" title="Delete">
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </form>
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}

function Field({
  label, name, defaultValue, type = "text", required, className,
}: {
  label: string; name: string; defaultValue?: string; type?: string;
  required?: boolean; className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={name} className="mb-1 block text-sm font-medium">{label}</label>
      <input id={name} name={name} type={type} defaultValue={defaultValue} required={required}
        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50" />
    </div>
  );
}