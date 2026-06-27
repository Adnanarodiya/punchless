"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@punchless/ui/components/button";
import { ConfirmModal } from "@punchless/ui/components/confirm-modal";
import { Modal } from "@punchless/ui/components/modal";
import { PaymentModeSelect } from "@punchless/ui/components/payment-mode-select";
import { cn } from "@punchless/ui/lib/utils";
import {
  createQuickCustomer,
  receiveClientPayment,
} from "@/lib/actions/client.actions";
import { CLIENT_PAYMENT_CONFIRM_THRESHOLD } from "@/lib/constants/payment-confirm";
import type { ClientWithDue } from "@/lib/queries/client.queries";
import { useAction } from "@/hooks/use-action";
import { formatCurrency } from "@/lib/utils/formatting";

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

function customerLabel(client: Pick<ClientWithDue, "name" | "alias">) {
  return client.alias ? `${client.name} (${client.alias})` : client.name;
}

export function CollectPaymentModal({
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
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [confirmPayOpen, setConfirmPayOpen] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<FormData | null>(null);
  const [confirmPayAmount, setConfirmPayAmount] = useState(0);
  const customerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setClientOptions(clients);
  }, [clients]);

  useEffect(() => {
    if (!open) {
      setCustomerQuery("");
      setShowCustomerList(false);
      setConfirmPayOpen(false);
      setPendingPayment(null);
      if (!initialClientId) setClientId("");
      return;
    }

    if (initialClientId) {
      setClientId(initialClientId);
      const match = clientOptions.find((c) => c.id === initialClientId);
      if (match) setCustomerQuery(customerLabel(match));
    }
  }, [open, initialClientId, clientOptions]);

  const filteredCustomers = useMemo(() => {
    const query = customerQuery.trim().toLowerCase();
    const active = clientOptions.filter((c) => !c.is_deleted);
    if (!query) return active.slice(0, 8);
    return active
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

  const { execute: execPayment, loading: paying } = useAction(receiveClientPayment, {
    successMessage: "Payment recorded.",
    onSuccess: () => {
      onSuccess?.();
      onOpenChange(false);
    },
  });

  function selectCustomer(client: ClientWithDue) {
    setClientId(client.id);
    setCustomerQuery(customerLabel(client));
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

  async function submitPayment(formData: FormData) {
    if (!clientId) return;
    formData.set("clientId", clientId);
    await execPayment(formData);
  }

  function handlePaymentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!clientId || paying) {
      toast.error("Select or create a customer first");
      customerInputRef.current?.focus();
      return;
    }

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
    <>
      <Modal open={open} onOpenChange={onOpenChange} title="Collect payment">
        <p className="mb-4 text-sm text-muted-foreground">
          Record cash or bank received from a customer. Search a customer or type a new name.
        </p>

        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          <div className="relative">
            <label htmlFor="collectPaymentSearch" className="mb-1 block text-sm font-medium">
              Customer
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={customerInputRef}
                id="collectPaymentSearch"
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
                Selected:{" "}
                <span className="font-medium text-foreground">{selectedClient.name}</span>
                {" · "}
                Due:{" "}
                <span className="font-medium text-foreground">
                  {formatCurrency(selectedClient.due_amount)}
                </span>
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
                        "flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-accent",
                        clientId === client.id && "bg-accent/60"
                      )}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectCustomer(client)}
                    >
                      <span>{customerLabel(client)}</span>
                      <span className="text-xs text-muted-foreground">
                        Due {formatCurrency(client.due_amount)}
                      </span>
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
            <label htmlFor="collectPaymentAmount" className="mb-1 block text-sm font-medium">
              Amount (₹)
            </label>
            <input
              id="collectPaymentAmount"
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              required
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Payment mode</label>
            <PaymentModeSelect name="paymentMode" defaultValue="cash" includeCredit={false} />
          </div>

          <div>
            <label htmlFor="collectPaymentDate" className="mb-1 block text-sm font-medium">
              Payment date
            </label>
            <input
              id="collectPaymentDate"
              name="paymentDate"
              type="date"
              required
              defaultValue={todayDate()}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>

          <div>
            <label htmlFor="collectPaymentRemark" className="mb-1 block text-sm font-medium">
              Remark <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <input
              id="collectPaymentRemark"
              name="remark"
              type="text"
              maxLength={500}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>

          <Button type="submit" loading={paying} disabled={paying} className="w-full sm:w-auto">
            Record payment
          </Button>
        </form>
      </Modal>

      <ConfirmModal
        open={confirmPayOpen}
        onOpenChange={setConfirmPayOpen}
        title="Confirm customer payment"
        description={
          selectedClient
            ? `Record payment of ${formatCurrency(confirmPayAmount)} from ${selectedClient.name}?`
            : undefined
        }
        confirmText="Record payment"
        onConfirm={() => void confirmPayment()}
        loading={paying}
      />
    </>
  );
}