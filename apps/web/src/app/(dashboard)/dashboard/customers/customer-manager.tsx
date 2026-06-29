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
  Building2,
  Users,
  FileText,
  Receipt,
} from "lucide-react";

import { ConfirmModal } from "@punchless/ui/components/confirm-modal";

import { Button } from "@punchless/ui/components/button";
import { Modal } from "@punchless/ui/components/modal";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@punchless/ui/components/data-table";
import { cn } from "@punchless/ui/lib/utils";
import { BankPaymentFields } from "@/components/bank-payment-fields";
import type { BankWithBalance } from "@/lib/queries/bank.queries";

import {
  createClient,
  updateClient,
  softDeleteClient,
  recoverClient,
  receiveClientPayment,
} from "@/lib/actions/client.actions";
import type { ClientWithDue } from "@/lib/queries/client.queries";
import { MaskedAmount } from "@/components/masked-amount";
import { CLIENT_PAYMENT_CONFIRM_THRESHOLD } from "@/lib/constants/payment-confirm";
import { formatCurrency } from "@/lib/utils/formatting";
import { useAction, toastAction } from "@/hooks/use-action";
import { DeleteConfirmButton } from "@/components/delete-confirm-button";
import { IconTooltip } from "@/components/icon-tooltip";

interface Props {
  customers: ClientWithDue[];
  banks: BankWithBalance[];
  summary: { totalClients: number; totalDue: number };
  initialCustomerId?: string;
  initialOpen?: "pay" | "invoice";
}

type ViewFilter = "active" | "deleted";

const defaultPaymentDate = () => new Date().toISOString().slice(0, 10);

export function CustomerManager({
  customers,
  banks,
  summary,
  initialCustomerId,
  initialOpen,
}: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"list" | "add" | "edit">("list");
  const [editingClient, setEditingClient] = useState<ClientWithDue | null>(null);
  const [viewFilter, setViewFilter] = useState<ViewFilter>("active");
  const [paymentClient, setPaymentClient] = useState<ClientWithDue | null>(null);
  const [confirmPayOpen, setConfirmPayOpen] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<FormData | null>(null);
  const [confirmPayAmount, setConfirmPayAmount] = useState(0);

  useEffect(() => {
    if (!initialCustomerId) return;
    const client = customers.find((c) => c.id === initialCustomerId && !c.is_deleted);
    if (!client) return;

    if (initialOpen === "pay") {
      setPaymentClient(client);
    } else if (initialOpen === "invoice") {
      router.replace(`/dashboard/invoices?customer=${client.id}&openForm=1`);
      return;
    }

    router.replace("/dashboard/customers");
  }, [initialCustomerId, initialOpen, customers, router]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((client) =>
      viewFilter === "active" ? !client.is_deleted : client.is_deleted
    );
  }, [customers, viewFilter]);

  const { execute: execCreate, loading: creating } = useAction(createClient, {
    successMessage: "Customer created!",
    onSuccess: () => setMode("list"),
  });

  const { execute: execUpdate, loading: updating } = useAction(updateClient, {
    successMessage: "Customer updated!",
    onSuccess: () => {
      setMode("list");
      setEditingClient(null);
    },
  });

  const { execute: execDelete, loading: deleting } = useAction(softDeleteClient, {
    successMessage: "Customer deleted",
  });

  const { execute: execPayment, loading: paying } = useAction(
    receiveClientPayment,
    {
      successMessage: "Payment recorded!",
      onSuccess: () => setPaymentClient(null),
    }
  );

  function startAdd() {
    setMode("add");
    setEditingClient(null);
  }

  function startEdit(client: ClientWithDue) {
    setMode("edit");
    setEditingClient(client);
  }

  function cancelForm() {
    setMode("list");
    setEditingClient(null);
  }

  async function handleCreate(formData: FormData) {
    await execCreate(formData);
  }

  async function handleUpdate(formData: FormData) {
    if (!editingClient) return;
    formData.set("clientId", editingClient.id);
    await execUpdate(formData);
  }

  async function submitPayment(formData: FormData) {
    if (!paymentClient) return;
    formData.set("clientId", paymentClient.id);
    await execPayment(formData);
  }

  function handlePaymentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!paymentClient || paying) return;

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
        title="Customers"
        description="Manage customer accounts, track dues, and record payments."
      >
        <Button onClick={startAdd}>
          <Plus className="size-4" /> Add customer
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total customers</p>
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Users className="size-4" />
            </div>
          </div>
          <p className="text-3xl font-bold">{summary.totalClients}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total Due</p>
            <div className="rounded-lg bg-warning/10 p-2 text-warning">
              <Building2 className="size-4" />
            </div>
          </div>
          <p className="text-3xl font-bold">
            <MaskedAmount amount={summary.totalDue} />
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {(mode === "add" || mode === "edit") && (
          <div className="rounded-xl border border-border bg-card p-5 lg:col-span-1">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {mode === "add" ? "Add customer" : "Edit customer"}
              </h2>
              <Button variant="ghost" size="icon" onClick={cancelForm}>
                <X className="size-4" />
              </Button>
            </div>
            <form
              action={mode === "add" ? handleCreate : handleUpdate}
              className="space-y-3"
            >
              <Field label="Customer name" name="name" required defaultValue={editingClient?.name} />
              <Field label="Alias" name="alias" defaultValue={editingClient?.alias ?? ""} />
              <Field label="Contact" name="contact" defaultValue={editingClient?.contact ?? ""} />
              <Field label="Address" name="address" defaultValue={editingClient?.address ?? ""} />
              <Field
                label="GST Number"
                name="gstNumber"
                defaultValue={editingClient?.gst_number ?? ""}
              />
              {mode === "add" ? (
                <Field
                  label="Opening Balance (₹)"
                  name="openingBalance"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue="0"
                />
              ) : null}
              <Button type="submit" className="w-full" loading={mode === "add" ? creating : updating} disabled={mode === "add" ? creating : updating}>
                {mode === "add" ? "Create customer" : "Save changes"}
              </Button>
            </form>
          </div>
        )}

        <div
          className={cn(
            "rounded-xl border border-border bg-card p-5",
            mode === "list" ? "lg:col-span-3" : "lg:col-span-2"
          )}
        >
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Button
              variant={viewFilter === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewFilter("active")}
            >
              Active
            </Button>
            <Button
              variant={viewFilter === "deleted" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewFilter("deleted")}
            >
              Deleted
            </Button>
          </div>

          <DataTable
            data={filteredCustomers}
            getRowKey={(row) => row.id}
            enableSearch
            searchPlaceholder="Search customers…"
            searchFilter={(row, query) => {
              const haystack = [
                row.name,
                row.alias,
                row.contact,
                row.address,
                row.gst_number,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
              return haystack.includes(query);
            }}
            emptyMessage={
              viewFilter === "active"
                ? "No customers yet. Add your first customer above."
                : "No deleted customers to recover."
            }
            columns={[
              {
                key: "name",
                header: "Customer",
                cell: (row) => (
                  <div>
                    <p className="font-medium">{row.name}</p>
                    {row.alias ? (
                      <p className="text-xs text-muted-foreground">{row.alias}</p>
                    ) : null}
                  </div>
                ),
              },
              {
                key: "contact",
                header: "Contact",
                cell: (row) => (
                  <span className="text-muted-foreground">{row.contact || "—"}</span>
                ),
              },
              {
                key: "gst",
                header: "GST",
                cell: (row) => (
                  <span className="text-muted-foreground">{row.gst_number || "—"}</span>
                ),
              },
              {
                key: "due",
                header: "Due",
                cell: (row) => (
                  <span
                    className={cn(
                      "font-medium",
                      row.due_amount > 0 ? "text-warning" : "text-success"
                    )}
                  >
                    {formatCurrency(row.due_amount)}
                  </span>
                ),
              },
              {
                key: "actions",
                header: "Actions",
                cell: (row) => (
                  <div className="flex flex-wrap gap-1">
                    {viewFilter === "active" ? (
                      <>
                        <IconTooltip label="Edit customer">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEdit(row)}
                            aria-label="Edit customer"
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                        </IconTooltip>
                        <IconTooltip label="Receive payment">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPaymentClient(row)}
                            aria-label="Receive payment"
                          >
                            <IndianRupee className="size-3.5" />
                          </Button>
                        </IconTooltip>
                        <IconTooltip label="Create invoice">
                          <Button variant="ghost" size="sm" asChild>
                            <Link
                              href={`/dashboard/invoices?customer=${row.id}&openForm=1`}
                              aria-label="Create invoice"
                            >
                              <Receipt className="size-3.5" />
                            </Link>
                          </Button>
                        </IconTooltip>
                        <IconTooltip label="View statement">
                          <Button variant="ghost" size="sm" asChild>
                            <Link
                              href={`/dashboard/customers/${row.id}/statement`}
                              aria-label="View statement"
                            >
                              <FileText className="size-3.5" />
                            </Link>
                          </Button>
                        </IconTooltip>
                        <DeleteConfirmButton
                          entityName={row.name}
                          entityType="client"
                          size="sm"
                          loading={deleting}
                          onConfirm={async () => {
                            const fd = new FormData();
                            fd.set("clientId", row.id);
                            await execDelete(fd);
                          }}
                        />
                      </>
                    ) : (
                      <form action={toastAction(recoverClient, "Customer recovered")}>
                        <input type="hidden" name="clientId" value={row.id} />
                        <Button variant="outline" size="sm" type="submit">
                          <RotateCcw className="size-3.5" /> Recover
                        </Button>
                      </form>
                    )}
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>

      <Modal
        open={!!paymentClient}
        onOpenChange={(open) => !open && setPaymentClient(null)}
        title={`Collect payment — ${paymentClient?.name ?? ""}`}
      >
        {paymentClient ? (
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Current due:{" "}
              <span className="font-medium text-foreground">
                {formatCurrency(paymentClient.due_amount)}
              </span>
            </p>
            <Field
              label="Amount (₹)"
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              required
            />
            <BankPaymentFields
              banks={banks}
              paymentModeSelectId="customerManagerPaymentMode"
              bankSelectId="customerManagerBankId"
            />
            <Field
              label="Payment Date"
              name="paymentDate"
              type="date"
              required
              defaultValue={defaultPaymentDate()}
            />
            <Field label="Remark" name="remark" />
            <div className="flex justify-end">
              <Button type="submit" loading={paying} disabled={paying}>
                Record Payment
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>

      <ConfirmModal
        open={confirmPayOpen}
        onOpenChange={setConfirmPayOpen}
        title="Confirm customer payment"
        description={
          paymentClient
            ? `Record payment of ${formatCurrency(confirmPayAmount)} from ${paymentClient.name}?`
            : undefined
        }
        confirmText="Record payment"
        onConfirm={() => void confirmPayment()}
        loading={paying}
      />
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
  min,
  step,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  required?: boolean;
  min?: string;
  step?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        min={min}
        step={step}
        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      />
    </div>
  );
}