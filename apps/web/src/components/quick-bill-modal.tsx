"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@punchless/ui/components/button";
import { Modal } from "@punchless/ui/components/modal";
import { cn } from "@punchless/ui/lib/utils";
import { createQuickBill } from "@/lib/actions/invoice.actions";
import { createQuickCustomer } from "@/lib/actions/client.actions";
import type { ClientWithDue } from "@/lib/queries/client.queries";
import { useAction } from "@/hooks/use-action";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: ClientWithDue[];
  initialClientId?: string;
  onSuccess?: () => void;
};

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function clientLabel(client: Pick<ClientWithDue, "name" | "alias">) {
  return client.alias ? `${client.name} (${client.alias})` : client.name;
}

export function QuickBillModal({
  open,
  onOpenChange,
  clients,
  initialClientId = "",
  onSuccess,
}: Props) {
  const [clientOptions, setClientOptions] = useState(clients);
  const [clientId, setClientId] = useState(initialClientId);
  const [customerQuery, setCustomerQuery] = useState("");
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"cash" | "credit">("cash");
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const customerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setClientOptions(clients);
  }, [clients]);

  useEffect(() => {
    if (!open) {
      setCustomerQuery("");
      setShowCustomerList(false);
      setPaymentMode("cash");
      if (!initialClientId) setClientId("");
      return;
    }

    if (initialClientId) {
      setClientId(initialClientId);
      const match = clientOptions.find((c) => c.id === initialClientId);
      if (match) setCustomerQuery(clientLabel(match));
    }
  }, [open, initialClientId, clientOptions]);

  const filteredCustomers = useMemo(() => {
    const query = customerQuery.trim().toLowerCase();
    if (!query) return clientOptions.slice(0, 8);
    return clientOptions
      .filter(
        (client) =>
          client.name.toLowerCase().includes(query) ||
          (client.alias?.toLowerCase().includes(query) ?? false)
      )
      .slice(0, 8);
  }, [clientOptions, customerQuery]);

  const trimmedQuery = customerQuery.trim();
  const canCreateCustomer =
    trimmedQuery.length > 0 &&
    !clientOptions.some(
      (client) => client.name.toLowerCase() === trimmedQuery.toLowerCase()
    );

  const selectedClient = clientOptions.find((c) => c.id === clientId);

  const { execute, loading } = useAction(createQuickBill, {
    successMessage: "Bill saved.",
    onSuccess: () => {
      onSuccess?.();
      onOpenChange(false);
    },
  });

  function selectCustomer(client: ClientWithDue) {
    setClientId(client.id);
    setCustomerQuery(clientLabel(client));
    setShowCustomerList(false);
  }

  async function handleCreateCustomer() {
    const name = trimmedQuery;
    if (!name || creatingCustomer) return;

    setCreatingCustomer(true);
    try {
      const fd = new FormData();
      fd.set("name", name);
      const result = await createQuickCustomer(fd);

      if (!result.success || !result.data) {
        toast.error(result.error || "Could not create customer");
        return;
      }

      const created = result.data as ClientWithDue;
      setClientOptions((prev) => [...prev, created]);
      selectCustomer(created);
      toast.success(`Customer "${name}" added`);
    } finally {
      setCreatingCustomer(false);
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Bill a customer">
      <p className="mb-4 text-sm text-muted-foreground">
        Quick bill — no GST. Search a customer or type a new name. You can add GST later from
        Invoices.
      </p>

      <form
        action={execute}
        className="space-y-4"
        onSubmit={(e) => {
          if (!clientId) {
            e.preventDefault();
            toast.error("Select or create a customer first");
            customerInputRef.current?.focus();
          }
        }}
      >
        <input type="hidden" name="clientId" value={clientId} />

        <div className="relative">
          <label htmlFor="quickBillCustomerSearch" className="mb-1 block text-sm font-medium">
            Customer
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={customerInputRef}
              id="quickBillCustomerSearch"
              type="text"
              autoComplete="off"
              placeholder="Search or type new customer name"
              value={customerQuery}
              onChange={(e) => {
                setCustomerQuery(e.target.value);
                setClientId("");
                setShowCustomerList(true);
              }}
              onFocus={() => setShowCustomerList(true)}
              onBlur={() => {
                window.setTimeout(() => {
                  setShowCustomerList(false);
                  if (!clientId && trimmedQuery) {
                    const exact = clientOptions.find(
                      (client) =>
                        client.name.toLowerCase() === trimmedQuery.toLowerCase()
                    );
                    if (exact) selectCustomer(exact);
                  }
                }, 150);
              }}
              className="h-10 w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>

          {selectedClient ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Selected: <span className="font-medium text-foreground">{selectedClient.name}</span>
            </p>
          ) : null}

          {showCustomerList && (filteredCustomers.length > 0 || canCreateCustomer) ? (
            <ul
              className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-border bg-popover py-1 shadow-md"
              role="listbox"
            >
              {filteredCustomers.map((client) => (
                <li key={client.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={clientId === client.id}
                    className={cn(
                      "flex w-full px-3 py-2 text-left text-sm hover:bg-accent",
                      clientId === client.id && "bg-accent/60"
                    )}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectCustomer(client)}
                  >
                    {clientLabel(client)}
                  </button>
                </li>
              ))}
              {canCreateCustomer ? (
                <li>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-primary hover:bg-accent"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleCreateCustomer}
                    disabled={creatingCustomer}
                  >
                    <Plus className="size-3.5 shrink-0" />
                    {creatingCustomer ? "Adding…" : `Add customer "${trimmedQuery}"`}
                  </button>
                </li>
              ) : null}
            </ul>
          ) : null}
        </div>

        <div>
          <label htmlFor="quickBillAmount" className="mb-1 block text-sm font-medium">
            Amount (₹)
          </label>
          <input
            id="quickBillAmount"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            required
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium">Payment</span>
          <div className="grid grid-cols-2 gap-2">
            <label
              className={cn(
                "flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2.5 text-sm font-medium transition",
                paymentMode === "cash"
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-input text-muted-foreground hover:bg-accent/50"
              )}
            >
              <input
                type="radio"
                name="paymentMode"
                value="cash"
                checked={paymentMode === "cash"}
                onChange={() => setPaymentMode("cash")}
                className="sr-only"
              />
              Paid now
            </label>
            <label
              className={cn(
                "flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2.5 text-sm font-medium transition",
                paymentMode === "credit"
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-input text-muted-foreground hover:bg-accent/50"
              )}
            >
              <input
                type="radio"
                name="paymentMode"
                value="credit"
                checked={paymentMode === "credit"}
                onChange={() => setPaymentMode("credit")}
                className="sr-only"
              />
              Udhar (credit)
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="quickBillDate" className="mb-1 block text-sm font-medium">
            Date
          </label>
          <input
            id="quickBillDate"
            name="invoiceDate"
            type="date"
            required
            defaultValue={todayDate()}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        </div>

        <div>
          <label htmlFor="quickBillDescription" className="mb-1 block text-sm font-medium">
            Note <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id="quickBillDescription"
            name="description"
            type="text"
            maxLength={200}
            placeholder="Workshop bill"
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button type="submit" loading={loading} disabled={loading} className="sm:min-w-28">
            Save bill
          </Button>
          <Link
            href={
              clientId
                ? `/dashboard/invoices?openForm=1&customer=${clientId}`
                : "/dashboard/invoices?openForm=1"
            }
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            onClick={() => onOpenChange(false)}
          >
            <FileText className="size-3.5" />
            Need GST? Full tax invoice
          </Link>
        </div>
      </form>
    </Modal>
  );
}