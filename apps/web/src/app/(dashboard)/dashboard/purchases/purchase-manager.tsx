"use client";

import { useMemo, useState } from "react";
import { Plus, X, Pencil, Trash2 } from "lucide-react";

import { Button } from "@punchless/ui/components/button";
import { PageHeader } from "@punchless/ui/components/page-header";
import { DataTable } from "@punchless/ui/components/data-table";
import { cn } from "@punchless/ui/lib/utils";

import {
  createPurchaseInvoice,
  updatePurchaseInvoice,
  softDeletePurchaseInvoice,
} from "@/lib/actions/purchase.actions";
import {
  calculateGstAmount,
  calculatePurchaseTotal,
} from "@/lib/validations/purchase.schema";
import type { PurchaseWithSupplier } from "@/lib/queries/purchase.queries";
import type { SupplierWithPayable } from "@/lib/queries/supplier.queries";
import { formatCurrency, formatDate } from "@/lib/utils/formatting";
import { useAction, toastAction } from "@/hooks/use-action";

const GST_SLABS = [0, 5, 12, 18, 28] as const;

interface Props {
  purchases: PurchaseWithSupplier[];
  suppliers: SupplierWithPayable[];
}

export function PurchaseManager({ purchases, suppliers }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingPurchase, setEditingPurchase] =
    useState<PurchaseWithSupplier | null>(null);
  const [taxableAmount, setTaxableAmount] = useState("");
  const [gstPercent, setGstPercent] = useState("18");

  const gstPreview = useMemo(() => {
    const amount = parseFloat(taxableAmount) || 0;
    const gst = parseFloat(gstPercent) || 0;
    return {
      gstAmount: calculateGstAmount(amount, gst),
      total: calculatePurchaseTotal(amount, gst),
    };
  }, [taxableAmount, gstPercent]);

  const { execute: execCreate } = useAction(createPurchaseInvoice, {
    successMessage: "Purchase invoice recorded!",
    onSuccess: () => {
      setShowForm(false);
      setTaxableAmount("");
      setGstPercent("18");
    },
  });

  const { execute: execUpdate } = useAction(updatePurchaseInvoice, {
    successMessage: "Purchase invoice updated!",
    onSuccess: () => {
      setShowForm(false);
      setEditingPurchase(null);
    },
  });

  function openAdd() {
    setEditingPurchase(null);
    setTaxableAmount("");
    setGstPercent("18");
    setShowForm(true);
  }

  function openEdit(purchase: PurchaseWithSupplier) {
    setEditingPurchase(purchase);
    setTaxableAmount(String(purchase.taxable_amount));
    setGstPercent(String(purchase.gst_percent));
    setShowForm(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchases"
        description="Record supplier purchase and sales invoices with GST breakdown."
      >
        <Button onClick={openAdd}>
          <Plus className="size-4" /> Add Invoice
        </Button>
      </PageHeader>

      {showForm ? (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {editingPurchase ? "Edit Purchase Invoice" : "Add Purchase Invoice"}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => { setShowForm(false); setEditingPurchase(null); }}>
              <X className="size-4" />
            </Button>
          </div>

          <form
            action={editingPurchase
              ? async (fd) => { fd.set("purchaseId", editingPurchase.id); await execUpdate(fd); }
              : execCreate}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            <div>
              <label htmlFor="supplierId" className="mb-1 block text-sm font-medium">Supplier</label>
              <select id="supplierId" name="supplierId" required defaultValue={editingPurchase?.supplier_id ?? ""}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
                <option value="" disabled>Select supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}{s.alias ? ` (${s.alias})` : ""}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="invoiceType" className="mb-1 block text-sm font-medium">Invoice Type</label>
              <select id="invoiceType" name="invoiceType" required defaultValue={editingPurchase?.invoice_type ?? "purchase"}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
                <option value="purchase">Purchase (increases payable)</option>
                <option value="sales">Sales / Credit note (reduces payable)</option>
              </select>
            </div>

            <Field label="Invoice Number" name="invoiceNumber" defaultValue={editingPurchase?.invoice_number ?? ""} />
            <Field label="Invoice Date" name="invoiceDate" type="date" required defaultValue={editingPurchase?.invoice_date ?? new Date().toISOString().slice(0, 10)} />

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
                {GST_SLABS.map((slab) => (
                  <option key={slab} value={slab}>{slab}%</option>
                ))}
              </select>
            </div>

            <Field label="Remark" name="remark" defaultValue={editingPurchase?.remark ?? ""} className="md:col-span-2" />

            <div className="rounded-lg border border-border bg-muted/30 p-4 md:col-span-2">
              <p className="text-sm text-muted-foreground">
                GST: <span className="font-medium text-foreground">{formatCurrency(gstPreview.gstAmount)}</span>
                {" · "}
                Total: <span className="font-medium text-foreground">{formatCurrency(gstPreview.total)}</span>
              </p>
            </div>

            <div className="md:col-span-2">
              <Button type="submit" className="w-full sm:w-auto">
                {editingPurchase ? "Save Changes" : "Record Invoice"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-card p-5">
        <DataTable
          data={purchases}
          getRowKey={(row) => row.id}
          enableSearch
          searchPlaceholder="Search purchases…"
          searchFilter={(row, query) =>
            [row.supplier_name, row.invoice_number, row.invoice_type]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(query)
          }
          emptyMessage="No purchase invoices yet."
          columns={[
            {
              key: "supplier",
              header: "Supplier",
              cell: (row) => (
                <div>
                  <p className="font-medium">{row.supplier_name}</p>
                  {row.supplier_alias ? <p className="text-xs text-muted-foreground">{row.supplier_alias}</p> : null}
                </div>
              ),
            },
            {
              key: "invoice",
              header: "Invoice",
              cell: (row) => row.invoice_number || "—",
            },
            {
              key: "date",
              header: "Date",
              cell: (row) => formatDate(row.invoice_date),
            },
            {
              key: "type",
              header: "Type",
              cell: (row) => (
                <span className={cn(
                  "inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                  row.invoice_type === "purchase" ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
                )}>
                  {row.invoice_type}
                </span>
              ),
            },
            {
              key: "gst",
              header: "GST",
              cell: (row) => `${row.gst_percent}% · ${formatCurrency(row.gst_amount)}`,
            },
            {
              key: "total",
              header: "Total",
              cell: (row) => <span className="font-medium">{formatCurrency(row.total_amount)}</span>,
            },
            {
              key: "actions",
              header: "Actions",
              cell: (row) => (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(row)} title="Edit">
                    <Pencil className="size-3.5" />
                  </Button>
                  <form action={toastAction(softDeletePurchaseInvoice, "Invoice deleted")}>
                    <input type="hidden" name="purchaseId" value={row.id} />
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

      {suppliers.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Add a supplier first before recording purchase invoices.
        </p>
      ) : null}
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