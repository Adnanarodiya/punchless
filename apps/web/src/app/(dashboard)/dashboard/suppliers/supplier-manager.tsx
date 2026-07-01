"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  X,
  Pencil,
  RotateCcw,
  IndianRupee,
  Truck,
  Users,
  FileText,
} from "lucide-react";

import { Button } from "@punchless/ui/components/button";
import { Modal } from "@punchless/ui/components/modal";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@punchless/ui/components/data-table";
import { cn } from "@punchless/ui/lib/utils";
import { BankPaymentFields } from "@/components/bank-payment-fields";
import { EntryDateHiddenInput } from "@/components/entry-date-hidden-input";
import { EntryDatePicker } from "@/components/entry-date-picker";
import type { BankWithBalance } from "@/lib/queries/bank.queries";

import {
  createSupplier,
  updateSupplier,
  softDeleteSupplier,
  recoverSupplier,
  paySupplier,
} from "@/lib/actions/supplier.actions";
import type { SupplierWithPayable } from "@/lib/queries/supplier.queries";
import { ConfirmModal } from "@punchless/ui/components/confirm-modal";
import { MaskedAmount } from "@/components/masked-amount";
import { CLIENT_PAYMENT_CONFIRM_THRESHOLD } from "@/lib/constants/payment-confirm";
import { formatCurrency } from "@/lib/utils/formatting";
import { useAction, toastAction } from "@/hooks/use-action";
import { DeleteConfirmButton } from "@/components/delete-confirm-button";
import { IconTooltip } from "@/components/icon-tooltip";
import { isSystemExpenseSupplier } from "@/lib/constants/system-parties";

interface Props {
  suppliers: SupplierWithPayable[];
  banks: BankWithBalance[];
  summary: { totalSuppliers: number; totalPayable: number };
  initialSupplierId?: string;
  initialOpen?: "pay";
}

type ViewFilter = "active" | "deleted";



export function SupplierManager({
  suppliers,
  banks,
  summary,
  initialSupplierId,
  initialOpen,
}: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"list" | "add" | "edit">("list");
  const [editingSupplier, setEditingSupplier] =
    useState<SupplierWithPayable | null>(null);
  const [viewFilter, setViewFilter] = useState<ViewFilter>("active");
  const [paymentSupplier, setPaymentSupplier] =
    useState<SupplierWithPayable | null>(null);
  const [confirmPayOpen, setConfirmPayOpen] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<FormData | null>(null);
  const [confirmPayAmount, setConfirmPayAmount] = useState(0);

  useEffect(() => {
    if (!initialSupplierId) return;
    const supplier = suppliers.find(
      (s) => s.id === initialSupplierId && !s.is_deleted
    );
    if (!supplier) return;

    if (initialOpen === "pay") {
      setPaymentSupplier(supplier);
    }

    router.replace("/dashboard/suppliers");
  }, [initialSupplierId, initialOpen, suppliers, router]);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) =>
      viewFilter === "active" ? !s.is_deleted : s.is_deleted
    );
  }, [suppliers, viewFilter]);

  const { execute: execCreate, loading: creating } = useAction(createSupplier, {
    successMessage: "Supplier created!",
    onSuccess: () => setMode("list"),
  });

  const { execute: execUpdate, loading: updating } = useAction(updateSupplier, {
    successMessage: "Supplier updated!",
    onSuccess: () => {
      setMode("list");
      setEditingSupplier(null);
    },
  });

  const { execute: execDelete, loading: deleting } = useAction(softDeleteSupplier, {
    successMessage: "Supplier deleted",
  });

  const { execute: execPayment, loading: paying } = useAction(paySupplier, {
    successMessage: "Payment recorded!",
    onSuccess: () => setPaymentSupplier(null),
  });

  async function submitPayment(formData: FormData) {
    if (!paymentSupplier) return;
    formData.set("supplierId", paymentSupplier.id);
    await execPayment(formData);
  }

  function handlePaymentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!paymentSupplier || paying) return;

    const formData = new FormData(event.currentTarget);
    const amount = Number(formData.get("amount") || 0);

    if (amount >= CLIENT_PAYMENT_CONFIRM_THRESHOLD) {
      setPendingPayment(formData);
      setConfirmPayAmount(amount);
      setConfirmPayOpen(true);
      return;
    }

    void submitPayment(formData);
  }

  async function confirmPayment() {
    if (!pendingPayment) return;
    await submitPayment(pendingPayment);
    setConfirmPayOpen(false);
    setPendingPayment(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suppliers"
        description="Manage vendors, track payables, and record payments."
      >
        <Button onClick={() => { setMode("add"); setEditingSupplier(null); }}>
          <Plus className="size-4" /> Add Supplier
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total Suppliers</p>
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Users className="size-4" />
            </div>
          </div>
          <p className="text-3xl font-bold">{summary.totalSuppliers}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total Payable</p>
            <div className="rounded-lg bg-warning/10 p-2 text-warning">
              <Truck className="size-4" />
            </div>
          </div>
          <p className="text-3xl font-bold">
            <MaskedAmount amount={summary.totalPayable} />
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {(mode === "add" || mode === "edit") && (
          <div className="rounded-xl border border-border bg-card p-5 lg:col-span-1">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {mode === "add" ? "Add Supplier" : "Edit Supplier"}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { setMode("list"); setEditingSupplier(null); }}
              >
                <X className="size-4" />
              </Button>
            </div>
            <form
              action={mode === "add" ? execCreate : async (fd) => {
                if (editingSupplier) {
                  fd.set("supplierId", editingSupplier.id);
                  await execUpdate(fd);
                }
              }}
              className="space-y-3"
            >
              <Field label="Supplier Name" name="name" required defaultValue={editingSupplier?.name} />
              <Field label="Alias" name="alias" defaultValue={editingSupplier?.alias ?? ""} />
              <Field label="Contact" name="contact" defaultValue={editingSupplier?.contact ?? ""} />
              <Field label="Address" name="address" defaultValue={editingSupplier?.address ?? ""} />
              <Field label="GST Number" name="gstNumber" defaultValue={editingSupplier?.gst_number ?? ""} />
              {mode === "add" ? (
                <Field label="Opening Balance (₹)" name="openingBalance" type="number" min="0" step="0.01" defaultValue="0" />
              ) : null}
              <Button type="submit" className="w-full" loading={mode === "add" ? creating : updating} disabled={mode === "add" ? creating : updating}>
                {mode === "add" ? "Create Supplier" : "Save Changes"}
              </Button>
            </form>
          </div>
        )}

        <div className={cn("rounded-xl border border-border bg-card p-5", mode === "list" ? "lg:col-span-3" : "lg:col-span-2")}>
          <div className="mb-4 flex flex-wrap gap-2">
            <Button variant={viewFilter === "active" ? "default" : "outline"} size="sm" onClick={() => setViewFilter("active")}>Active</Button>
            <Button variant={viewFilter === "deleted" ? "default" : "outline"} size="sm" onClick={() => setViewFilter("deleted")}>Deleted</Button>
          </div>

          <DataTable
            data={filteredSuppliers}
            getRowKey={(row) => row.id}
            enableSearch
            searchPlaceholder="Search suppliers…"
            searchFilter={(row, query) =>
              [row.name, row.alias, row.contact, row.gst_number]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(query)
            }
            emptyMessage={viewFilter === "active" ? "No suppliers yet." : "No deleted suppliers."}
            columns={[
              {
                key: "name",
                header: "Supplier",
                cell: (row) => (
                  <div>
                    <p className="font-medium">{row.name}</p>
                    {row.alias ? <p className="text-xs text-muted-foreground">{row.alias}</p> : null}
                  </div>
                ),
              },
              { key: "contact", header: "Contact", cell: (row) => row.contact || "—" },
              { key: "gst", header: "GST", cell: (row) => row.gst_number || "—" },
              {
                key: "payable",
                header: "Payable",
                cell: (row) => (
                  <span className={cn("font-medium", row.payable_amount > 0 ? "text-warning" : "text-success")}>
                    {formatCurrency(row.payable_amount)}
                  </span>
                ),
              },
              {
                key: "actions",
                header: "Actions",
                cell: (row) => {
                  const isSystemExpense = isSystemExpenseSupplier(row);
                  return (
                  <div className="flex flex-wrap gap-1">
                    {viewFilter === "active" ? (
                      <>
                        {!isSystemExpense ? (
                          <IconTooltip label="Edit supplier">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setMode("edit"); setEditingSupplier(row); }}
                              aria-label="Edit supplier"
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                          </IconTooltip>
                        ) : null}
                        <IconTooltip
                          label={isSystemExpense ? "Record expense" : "Pay supplier"}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPaymentSupplier(row)}
                            aria-label={
                              isSystemExpense ? "Record expense" : "Pay supplier"
                            }
                          >
                            <IndianRupee className="size-3.5" />
                          </Button>
                        </IconTooltip>
                        <IconTooltip label="View statement">
                          <Button variant="ghost" size="sm" asChild>
                            <Link
                              href={`/dashboard/suppliers/${row.id}/statement`}
                              aria-label="View statement"
                            >
                              <FileText className="size-3.5" />
                            </Link>
                          </Button>
                        </IconTooltip>
                        {!isSystemExpense ? (
                          <DeleteConfirmButton
                            entityName={row.name}
                            entityType="supplier"
                            size="sm"
                            loading={deleting}
                            onConfirm={async () => {
                              const fd = new FormData();
                              fd.set("supplierId", row.id);
                              await execDelete(fd);
                            }}
                          />
                        ) : null}
                      </>
                    ) : (
                      <form action={toastAction(recoverSupplier, "Supplier recovered")}>
                        <input type="hidden" name="supplierId" value={row.id} />
                        <Button variant="outline" size="sm" type="submit">
                          <RotateCcw className="size-3.5" /> Recover
                        </Button>
                      </form>
                    )}
                  </div>
                  );
                },
              },
            ]}
          />
        </div>
      </div>

      <Modal
        open={!!paymentSupplier}
        onOpenChange={(open) => !open && setPaymentSupplier(null)}
        title={`Pay Now — ${paymentSupplier?.name ?? ""}`}
        headerAccessory={<EntryDatePicker />}
      >
        {paymentSupplier ? (
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Current payable:{" "}
              <span className="font-medium text-foreground">{formatCurrency(paymentSupplier.payable_amount)}</span>
            </p>
            <Field label="Amount (₹)" name="amount" type="number" min="0.01" step="0.01" required />
            <BankPaymentFields
              banks={banks}
              paymentModeSelectId="supplierManagerPaymentMode"
              bankSelectId="supplierManagerBankId"
            />
            <EntryDateHiddenInput name="paymentDate" />
            <Field label="Remark" name="remark" />
            <div className="flex justify-end">
              <Button type="submit" loading={paying} disabled={paying}>Record Payment</Button>
            </div>
          </form>
        ) : null}
      </Modal>

      <ConfirmModal
        open={confirmPayOpen}
        onOpenChange={setConfirmPayOpen}
        title="Confirm supplier payment"
        description={
          paymentSupplier
            ? `Pay ${formatCurrency(confirmPayAmount)} to ${paymentSupplier.name}?`
            : undefined
        }
        confirmText="Confirm payment"
        onConfirm={() => void confirmPayment()}
        loading={paying}
      />
    </div>
  );
}

function Field({
  label, name, defaultValue, type = "text", required, min, step,
}: {
  label: string; name: string; defaultValue?: string; type?: string;
  required?: boolean; min?: string; step?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium">{label}</label>
      <input id={name} name={name} type={type} defaultValue={defaultValue} required={required} min={min} step={step}
        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50" />
    </div>
  );
}