"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { FileText, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@punchless/ui/components/button";
import { Modal } from "@punchless/ui/components/modal";
import { cn } from "@punchless/ui/lib/utils";
import { createQuickBill } from "@/lib/actions/invoice.actions";
import { createQuickCustomer } from "@/lib/actions/client.actions";
import type { ClientWithDue } from "@/lib/queries/client.queries";
import { useAction } from "@/hooks/use-action";
import {
  entityDisplayLabel,
  filterEntitiesByQuery,
  findEntityByQuery,
  isNewEntityName,
} from "@/lib/utils/entity-picker";
import { resolvePaymentBreakdown } from "@/lib/validations/invoice.schema";
import { formatCurrency } from "@/lib/utils/formatting";

type QuickBillPaymentMode = "cash" | "bank" | "credit" | "split";

const QUICK_BILL_PAYMENT_OPTIONS: { value: QuickBillPaymentMode; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank" },
  { value: "credit", label: "Credit (Udhar)" },
  { value: "split", label: "Cash + Bank" },
];

const fieldClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

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
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState<QuickBillPaymentMode>("cash");
  const [cashAmount, setCashAmount] = useState("");
  const [bankAmount, setBankAmount] = useState("");
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const customerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setClientOptions(clients);
  }, [clients]);

  useEffect(() => {
    if (!open) {
      setCustomerQuery("");
      setShowCustomerList(false);
      setAmount("");
      setPaymentMode("cash");
      setCashAmount("");
      setBankAmount("");
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

  const splitPreview = useMemo(() => {
    const billTotal = parseFloat(amount) || 0;
    if (paymentMode !== "split" || billTotal <= 0) return null;

    return resolvePaymentBreakdown(
      "split",
      billTotal,
      0,
      parseFloat(cashAmount) || 0,
      parseFloat(bankAmount) || 0
    );
  }, [amount, paymentMode, cashAmount, bankAmount]);

  const { execute, loading } = useAction(createQuickBill, {
    successMessage: "Bill saved.",
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || creatingCustomer) return;

    const id = await ensureCustomerSelected();
    if (!id) {
      toast.error("Enter a customer name");
      customerInputRef.current?.focus();
      return;
    }

    const formData = new FormData(event.currentTarget);
    formData.set("clientId", id);
    await execute(formData);
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
    <Modal open={open} onOpenChange={onOpenChange} title="Bill a customer">
      <p className="mb-4 text-sm text-muted-foreground">
        Quick bill — no GST. Search a customer or type a new name — new names are saved
        automatically. You can add GST later from Invoices.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
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
              onBlur={handleCustomerBlur}
              className="h-10 w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>

          {selectedClient ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Selected: <span className="font-medium text-foreground">{selectedClient.name}</span>
            </p>
          ) : isNewCustomer ? (
            <p className="mt-1 text-xs text-muted-foreground">
              New customer — will be added when you save the bill
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
                      "flex w-full px-3 py-2 text-left text-sm hover:bg-accent",
                      clientId === client.id && "bg-accent/60"
                    )}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectCustomer(client)}
                  >
                    {entityDisplayLabel(client)}
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
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={fieldClass}
          />
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium">Payment</span>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_BILL_PAYMENT_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={cn(
                  "flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2.5 text-sm font-medium transition",
                  paymentMode === option.value
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-input text-muted-foreground hover:bg-accent/50"
                )}
              >
                <input
                  type="radio"
                  name="paymentMode"
                  value={option.value}
                  checked={paymentMode === option.value}
                  onChange={() => setPaymentMode(option.value)}
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Cash/Bank = paid now. Credit = udhar. Cash + Bank = split part cash, part bank.
          </p>
        </div>

        {paymentMode === "split" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="quickBillCashAmount" className="mb-1 block text-sm font-medium">
                Cash amount (₹)
              </label>
              <input
                id="quickBillCashAmount"
                name="cashAmount"
                type="number"
                min="0"
                step="0.01"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="quickBillBankAmount" className="mb-1 block text-sm font-medium">
                Bank amount (₹)
              </label>
              <input
                id="quickBillBankAmount"
                name="bankAmount"
                type="number"
                min="0"
                step="0.01"
                value={bankAmount}
                onChange={(e) => setBankAmount(e.target.value)}
                className={fieldClass}
              />
            </div>
            {splitPreview ? (
              <p className="text-xs text-muted-foreground sm:col-span-2">
                Cash {formatCurrency(splitPreview.cashAmount)} · Bank{" "}
                {formatCurrency(splitPreview.bankAmount)}
                {splitPreview.creditAmount > 0
                  ? ` · Udhar ${formatCurrency(splitPreview.creditAmount)}`
                  : null}
              </p>
            ) : null}
          </div>
        ) : (
          <>
            <input type="hidden" name="cashAmount" value="0" />
            <input type="hidden" name="bankAmount" value="0" />
          </>
        )}

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
          <Button
            type="submit"
            loading={loading || creatingCustomer}
            disabled={loading || creatingCustomer}
            className="sm:min-w-28"
          >
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