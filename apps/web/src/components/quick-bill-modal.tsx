"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@punchless/ui/components/button";
import { Modal } from "@punchless/ui/components/modal";
import { cn } from "@punchless/ui/lib/utils";
import { createSalesBill } from "@/lib/actions/invoice.actions";
import { createQuickCustomer } from "@/lib/actions/client.actions";
import type { ClientWithDue } from "@/lib/queries/client.queries";
import { useAction } from "@/hooks/use-action";
import {
  entityDisplayLabel,
  filterEntitiesByQuery,
  findEntityByQuery,
  isNewEntityName,
} from "@/lib/utils/entity-picker";

const fieldClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: ClientWithDue[];
  invoicePrefix?: string;
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
  invoicePrefix = "ISHABA",
  initialClientId = "",
  onSuccess,
}: Props) {
  const [clientOptions, setClientOptions] = useState(clients);
  const [clientId, setClientId] = useState(initialClientId);
  const [customerQuery, setCustomerQuery] = useState("");
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [invoiceSuffix, setInvoiceSuffix] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(todayDate());
  const [gstNumber, setGstNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [remark, setRemark] = useState("");
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const customerInputRef = useRef<HTMLInputElement>(null);

  const prefix = invoicePrefix.trim().toUpperCase() || "ISHABA";

  useEffect(() => {
    setClientOptions(clients);
  }, [clients]);

  useEffect(() => {
    if (!open) {
      setCustomerQuery("");
      setShowCustomerList(false);
      setInvoiceSuffix("");
      setInvoiceDate(todayDate());
      setGstNumber("");
      setAmount("");
      setRemark("");
      if (!initialClientId) setClientId("");
      return;
    }

    if (initialClientId) {
      setClientId(initialClientId);
      const match = clientOptions.find((c) => c.id === initialClientId);
      if (match) {
        setCustomerQuery(entityDisplayLabel(match));
        setGstNumber(match.gst_number ?? "");
      }
    }
  }, [open, initialClientId, clientOptions]);

  const trimmedQuery = customerQuery.trim();

  const filteredCustomers = useMemo(
    () => filterEntitiesByQuery(clientOptions, customerQuery),
    [clientOptions, customerQuery]
  );

  const isNewCustomer = isNewEntityName(clientOptions, customerQuery);
  const selectedClient = clientOptions.find((c) => c.id === clientId);

  const { execute, loading } = useAction(createSalesBill, {
    successMessage: "Sales bill saved.",
    onSuccess: () => {
      onSuccess?.();
      onOpenChange(false);
    },
  });

  function selectCustomer(client: ClientWithDue) {
    setClientId(client.id);
    setCustomerQuery(entityDisplayLabel(client));
    setGstNumber(client.gst_number ?? "");
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
      if (gstNumber.trim()) fd.set("gstNumber", gstNumber.trim());
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

    if (!invoiceSuffix.trim()) {
      toast.error("Enter invoice number after the prefix");
      return;
    }

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
    <Modal open={open} onOpenChange={onOpenChange} title="Sales bill">
      <p className="mb-4 text-sm text-muted-foreground">
        Record a sales bill — posts to the customer ledger. Collect payment separately via General.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="salesBillInvoiceSuffix" className="mb-1 block text-sm font-medium">
            Invoice number
          </label>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-10 shrink-0 items-center rounded-lg border border-input bg-muted px-3 text-sm font-semibold">
              {prefix}-
            </span>
            <input
              id="salesBillInvoiceSuffix"
              name="invoiceSuffix"
              type="text"
              required
              placeholder="1042"
              value={invoiceSuffix}
              onChange={(e) => setInvoiceSuffix(e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="salesBillDate" className="mb-1 block text-sm font-medium">
            Date
          </label>
          <input
            id="salesBillDate"
            name="invoiceDate"
            type="date"
            required
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
            className={fieldClass}
          />
        </div>

        <div className="relative">
          <label htmlFor="salesBillCustomer" className="mb-1 block text-sm font-medium">
            Party name
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={customerInputRef}
              id="salesBillCustomer"
              type="text"
              autoComplete="off"
              placeholder="Search or type party name"
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
              New party — will be added when you save
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
            </ul>
          ) : null}
        </div>

        <div>
          <label htmlFor="salesBillGst" className="mb-1 block text-sm font-medium">
            Party GST number{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id="salesBillGst"
            name="gstNumber"
            type="text"
            maxLength={20}
            value={gstNumber}
            onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
            placeholder="15-digit GSTIN"
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="salesBillAmount" className="mb-1 block text-sm font-medium">
            Amount (₹)
          </label>
          <input
            id="salesBillAmount"
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
          <label htmlFor="salesBillRemark" className="mb-1 block text-sm font-medium">
            Remark <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id="salesBillRemark"
            name="remark"
            type="text"
            maxLength={500}
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            className={fieldClass}
          />
        </div>

        <Button
          type="submit"
          loading={loading || creatingCustomer}
          disabled={loading || creatingCustomer}
          className="w-full sm:w-auto sm:min-w-28"
        >
          Save bill
        </Button>
      </form>
    </Modal>
  );
}