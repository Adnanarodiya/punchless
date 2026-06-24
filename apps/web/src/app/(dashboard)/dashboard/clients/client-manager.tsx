"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus,
  X,
  Pencil,
  Trash2,
  RotateCcw,
  IndianRupee,
  Building2,
  Users,
  FileText,
} from "lucide-react";

import { Button } from "@punchless/ui/components/button";
import { Modal } from "@punchless/ui/components/modal";
import { PageHeader } from "@punchless/ui/components/page-header";
import { DataTable } from "@punchless/ui/components/data-table";
import { PaymentModeSelect } from "@punchless/ui/components/payment-mode-select";
import { cn } from "@punchless/ui/lib/utils";

import {
  createClient,
  updateClient,
  softDeleteClient,
  recoverClient,
  receiveClientPayment,
} from "@/lib/actions/client.actions";
import type { ClientWithDue } from "@/lib/queries/client.queries";
import { formatCurrency } from "@/lib/utils/formatting";
import { useAction, toastAction } from "@/hooks/use-action";

interface Props {
  clients: ClientWithDue[];
  summary: { totalClients: number; totalDue: number };
}

type ViewFilter = "active" | "deleted";

const defaultPaymentDate = () => new Date().toISOString().slice(0, 10);

export function ClientManager({ clients, summary }: Props) {
  const [mode, setMode] = useState<"list" | "add" | "edit">("list");
  const [editingClient, setEditingClient] = useState<ClientWithDue | null>(null);
  const [viewFilter, setViewFilter] = useState<ViewFilter>("active");
  const [paymentClient, setPaymentClient] = useState<ClientWithDue | null>(null);

  const filteredClients = useMemo(() => {
    return clients.filter((client) =>
      viewFilter === "active" ? !client.is_deleted : client.is_deleted
    );
  }, [clients, viewFilter]);

  const { execute: execCreate } = useAction(createClient, {
    successMessage: "Client created!",
    onSuccess: () => setMode("list"),
  });

  const { execute: execUpdate } = useAction(updateClient, {
    successMessage: "Client updated!",
    onSuccess: () => {
      setMode("list");
      setEditingClient(null);
    },
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

  async function handlePayment(formData: FormData) {
    if (!paymentClient) return;
    formData.set("clientId", paymentClient.id);
    await execPayment(formData);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="Manage client accounts, track dues, and record payments."
      >
        <Button onClick={startAdd}>
          <Plus className="size-4" /> Add Client
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total Clients</p>
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
          <p className="text-3xl font-bold">{formatCurrency(summary.totalDue)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {(mode === "add" || mode === "edit") && (
          <div className="rounded-xl border border-border bg-card p-5 lg:col-span-1">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {mode === "add" ? "Add Client" : "Edit Client"}
              </h2>
              <Button variant="ghost" size="icon" onClick={cancelForm}>
                <X className="size-4" />
              </Button>
            </div>
            <form
              action={mode === "add" ? handleCreate : handleUpdate}
              className="space-y-3"
            >
              <Field label="Client Name" name="name" required defaultValue={editingClient?.name} />
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
              <Button type="submit" className="w-full">
                {mode === "add" ? "Create Client" : "Save Changes"}
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
            data={filteredClients}
            getRowKey={(row) => row.id}
            enableSearch
            searchPlaceholder="Search clients…"
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
                ? "No clients yet. Add your first client above."
                : "No deleted clients to recover."
            }
            columns={[
              {
                key: "name",
                header: "Client",
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(row)}
                          title="Edit"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPaymentClient(row)}
                          title="Receive payment"
                        >
                          <IndianRupee className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" asChild title="Statement">
                          <Link href={`/dashboard/clients/${row.id}/statement`}>
                            <FileText className="size-3.5" />
                          </Link>
                        </Button>
                        <form action={toastAction(softDeleteClient, "Client deleted")}>
                          <input type="hidden" name="clientId" value={row.id} />
                          <Button
                            variant="ghost"
                            size="sm"
                            type="submit"
                            title="Delete"
                          >
                            <Trash2 className="size-3.5 text-destructive" />
                          </Button>
                        </form>
                      </>
                    ) : (
                      <form action={toastAction(recoverClient, "Client recovered")}>
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
        title={`Receive Payment — ${paymentClient?.name ?? ""}`}
      >
        {paymentClient ? (
          <form action={handlePayment} className="space-y-4">
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
            <div>
              <label className="mb-1 block text-sm font-medium">Payment Mode</label>
              <PaymentModeSelect
                name="paymentMode"
                defaultValue="cash"
                includeCredit={false}
              />
            </div>
            <Field
              label="Payment Date"
              name="paymentDate"
              type="date"
              required
              defaultValue={defaultPaymentDate()}
            />
            <Field label="Remark" name="remark" />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPaymentClient(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={paying}>
                Record Payment
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>
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