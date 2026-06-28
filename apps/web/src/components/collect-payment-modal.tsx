"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Search } from "lucide-react";
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
import {
  entityDisplayLabel,
  filterEntitiesByQuery,
  findEntityByQuery,
  isNewEntityName,
} from "@/lib/utils/entity-picker";

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
      if (match) setCustomerQuery(entityDisplayLabel(match));
    }
  }, [open, initialClientId, clientOptions]);

  const trimmedQuery = customerQuery.trim();

  const filteredCustomers = useMemo(
    () => filterEntitiesByQuery(clientOptions, customerQuery),
    [clientOptions, customerQuery]
  );

  const isNewCustomer = isNewEntityName(clientOptions, customerQuery);
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
    setCustomerQuery(entityDisplayLabel(client));
    setShowCustomerList(false);
  }

  async function ensureCustomerSelected(): Promise<string | null> {
    if (clientId) return clientId;

    const name = trimmedQuery;
    if (!name) return null;

    const exact = findEntityByQuery(clientOptions, name);
    if (exact) {
      selectCustomer(exact);
      return exact.id;
    }

    if (creatingCustomer) return null;

    setCreatingCustomer(true);
    try {
      const fd = new FormData();
      fd.set("name", name);
      const result = await createQuickCustomer(fd);

      if (!result.success || !result.data) {
        toast.error(result.error || "Could not create customer");
        return null;
      }

      const created = result.data as ClientWithDue;
      setClientOptions((prev) => [...prev, created]);
      selectCustomer(created);
      return created.id;
    } finally {
      setCreatingCustomer(false);
    }
  }

  async function submitPayment(formData: FormData, resolvedClientId: string) {
    formData.set("clientId", resolvedClientId);
    await execPayment(formData);
  }

  async function handlePaymentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (paying || creatingCustomer) return;

    const resolvedClientId = await ensureCustomerSelected();
    if (!resolvedClientId) {
      toast.error("Enter a customer name");
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

    await submitPayment(formData, resolvedClientId);
  }

  async function confirmPayment() {
    if (!pendingPayment) return;

    const resolvedClientId = await ensureCustomerSelected();
    if (!resolvedClientId) return;

    await submitPayment(pendingPayment, resolvedClientId);
    setConfirmPayOpen(false);
    setPendingPayment(null);
  }

  function handleCustomerBlur() {
    window.setTimeout(() => {
      setShowCustomerList(false);
      if (!clientId && trimmedQuery) {
        void ensureCustomerSelected();
      }
    }, 150);
  }

  return (
    <>
      <Modal open={open} onOpenChange={onOpenChange} title="Collect payment">
        <p className="mb-4 text-sm text-muted-foreground">
          Record cash or bank received from a customer. Search or type a new name — new customers
          are saved automatically.
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
                onBlur={handleCustomerBlur}
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
            ) : isNewCustomer ? (
              <p className="mt-1 text-xs text-muted-foreground">
                New customer — will be added when you record payment
              </p>
            ) : null}

            {showCustomerList && (filteredCustomers.length > 0 || isNewCustomer) ? (
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
                      <span>{entityDisplayLabel(client)}</span>
                      <span className="text-xs text-muted-foreground">
                        Due {formatCurrency(client.due_amount)}
                      </span>
                    </button>
                  </li>
                ))}
                {isNewCustomer && filteredCustomers.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-muted-foreground">
                    Press Tab or save — &quot;{trimmedQuery}&quot; will be added as a new customer
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

          <Button
            type="submit"
            loading={paying || creatingCustomer}
            disabled={paying || creatingCustomer}
            className="w-full sm:w-auto"
          >
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
            : isNewCustomer
              ? `Record payment of ${formatCurrency(confirmPayAmount)} from new customer "${trimmedQuery}"? They will be added automatically.`
              : undefined
        }
        confirmText="Record payment"
        onConfirm={() => void confirmPayment()}
        loading={paying || creatingCustomer}
      />
    </>
  );
}