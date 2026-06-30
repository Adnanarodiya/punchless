"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { toast } from "sonner";

import { Button } from "@punchless/ui/components/button";
import { ConfirmModal } from "@punchless/ui/components/confirm-modal";
import { Modal } from "@punchless/ui/components/modal";
import { cn } from "@punchless/ui/lib/utils";
import { AgainstBillPicker } from "@/components/against-bill-picker";
import { BankPaymentFields } from "@/components/bank-payment-fields";
import { PartySearchField } from "@/components/party-search-field";
import { SettlementTypeField } from "@/components/settlement-type-field";
import {
  createQuickCustomer,
  receiveClientPayment,
} from "@/lib/actions/client.actions";
import type { BankWithBalance } from "@/lib/queries/bank.queries";
import type { ClientWithDue } from "@/lib/queries/client.queries";
import { useAction } from "@/hooks/use-action";
import {
  entityDisplayLabel,
  findEntityByQuery,
  isNewEntityName,
} from "@/lib/utils/entity-picker";
import { focusField, handleEnterToNextField } from "@/lib/utils/form-keyboard";
import { formatCurrency } from "@/lib/utils/formatting";
import type { SettlementType } from "@/lib/validations/settlement.schema";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: ClientWithDue[];
  banks: BankWithBalance[];
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
  banks,
  initialClientId = "",
  onSuccess,
}: Props) {
  const [clientOptions, setClientOptions] = useState(clients);
  const [clientId, setClientId] = useState(initialClientId);
  const [customerQuery, setCustomerQuery] = useState("");
  const [settlementType, setSettlementType] = useState<SettlementType>("direct");
  const [billIds, setBillIds] = useState<string[]>([]);
  const [selectedBillsTotal, setSelectedBillsTotal] = useState(0);
  const [selectedInvoiceNumber, setSelectedInvoiceNumber] = useState("");
  const [amount, setAmount] = useState("");
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
      setSettlementType("direct");
      setBillIds([]);
      setSelectedBillsTotal(0);
      setSelectedInvoiceNumber("");
      setAmount("");
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
  const isNewCustomer = isNewEntityName(clientOptions, customerQuery);
  const selectedClient = clientOptions.find((c) => c.id === clientId);

  const { execute: execPayment, loading: paying } = useAction(receiveClientPayment, {
    successMessage: "Payment recorded.",
    onSuccess: () => {
      onSuccess?.();
      onOpenChange(false);
    },
  });

  function selectCustomer(client: ClientWithDue, invoiceNumber?: string, linkedBillId?: string) {
    setClientId(client.id);
    setCustomerQuery(
      invoiceNumber
        ? `${entityDisplayLabel(client)} · #${invoiceNumber}`
        : entityDisplayLabel(client)
    );
    setSelectedInvoiceNumber(invoiceNumber ?? "");
    setBillIds(linkedBillId ? [linkedBillId] : []);
  }

  function clearCustomerSelection() {
    setClientId("");
    setBillIds([]);
    setSelectedBillsTotal(0);
    setSelectedInvoiceNumber("");
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
    formData.set("settlementType", settlementType);
    await execPayment(formData);
  }

  async function openPaymentConfirm(form: HTMLFormElement): Promise<boolean> {
    const resolvedClientId = await ensureCustomerSelected();
    if (!resolvedClientId) {
      toast.error("Enter a customer name");
      customerInputRef.current?.focus();
      return false;
    }

    if (settlementType === "against_bill" && billIds.length === 0) {
      toast.error("Select at least one bill to settle against");
      return false;
    }

    const formData = new FormData(form);
    const payAmount = Number(formData.get("amount") || 0);
    setPendingPayment(formData);
    setConfirmPayAmount(payAmount);
    setConfirmPayOpen(true);
    return true;
  }

  async function handlePaymentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (paying || creatingCustomer) return;
    await openPaymentConfirm(event.currentTarget);
  }

  async function handleRemarkEnter(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (paying || creatingCustomer) return;
    const form = event.currentTarget.form;
    if (!form) return;
    await openPaymentConfirm(form);
  }

  function focusSettlementField() {
    focusField("collectPaymentSettlementDirect");
  }

  function focusAfterSettlement() {
    if (settlementType === "against_bill" && clientId) {
      if (focusField("collectPaymentBillSearch")) return;
      if (focusField("collectPaymentFirstBill")) return;
    }
    focusField("collectPaymentDate");
  }

  const showBillPanel = settlementType === "against_bill" && Boolean(clientId);

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
      if (!clientId && trimmedQuery) {
        void ensureCustomerSelected();
      }
    }, 150);
  }

  return (
    <>
      <Modal
        open={open}
        onOpenChange={onOpenChange}
        title="Collect payment"
        className={cn(showBillPanel && "sm:max-w-4xl")}
      >
        <form
          onSubmit={handlePaymentSubmit}
          className={cn(
            showBillPanel
              ? "grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] md:items-start"
              : "space-y-4"
          )}
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Record cash or bank received from a customer. Search by party name or bill
              number.
            </p>
          <div onBlur={handleCustomerBlur}>
            <PartySearchField
              id="collectPaymentSearch"
              label="Customer"
              side="client"
              entities={clientOptions}
              partyId={clientId}
              query={customerQuery}
              selectedInvoiceNumber={selectedInvoiceNumber}
              onQueryChange={setCustomerQuery}
              onSelect={(selection) => {
                const client = clientOptions.find((c) => c.id === selection.partyId);
                if (client) {
                  selectCustomer(
                    client,
                    selection.invoiceNumber,
                    selection.billId
                  );
                } else {
                  setClientId(selection.partyId);
                  setCustomerQuery(selection.displayQuery);
                  setBillIds(selection.billId ? [selection.billId] : []);
                  setSelectedInvoiceNumber(selection.invoiceNumber ?? "");
                }
              }}
              onClearSelection={clearCustomerSelection}
              nextFieldId="collectPaymentAmount"
              outstandingAmount={selectedClient?.due_amount}
              outstandingLabel="Due"
              newPartyHint="New customer — will be added when you record payment"
            />
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
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => handleEnterToNextField(e, "collectPaymentMode")}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
            {settlementType === "against_bill" && selectedBillsTotal > 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Selected bills total due:{" "}
                <span className="font-medium text-foreground">
                  {formatCurrency(selectedBillsTotal)}
                </span>
              </p>
            ) : null}
          </div>

          <BankPaymentFields
            banks={banks}
            paymentModeSelectId="collectPaymentMode"
            bankSelectId="collectPaymentBankId"
            bankChannelUpiId="collectPaymentBankUpi"
            bankChannelNbId="collectPaymentBankNb"
            onPaymentModeEnter={(mode) => {
              if (mode === "bank") {
                focusField("collectPaymentBankUpi");
              } else {
                focusSettlementField();
              }
            }}
            onBankChannelEnter={() => focusField("collectPaymentBankId")}
            onBankAccountEnter={focusSettlementField}
          />

          <SettlementTypeField
            idPrefix="collectPayment"
            value={settlementType}
            onChange={(value) => {
              setSettlementType(value);
              if (value === "direct") {
                setBillIds([]);
                setSelectedBillsTotal(0);
              }
            }}
            onEnterAdvance={focusAfterSettlement}
          />

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
              onKeyDown={(e) => handleEnterToNextField(e, "collectPaymentRemark")}
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
              onKeyDown={(e) => void handleRemarkEnter(e)}
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
          </div>

          {showBillPanel ? (
            <aside className="rounded-lg border border-border bg-muted/20 p-4 md:sticky md:top-0">
              <AgainstBillPicker
                partyId={clientId}
                side="client"
                variant="panel"
                selectedBillIds={billIds}
                onBillsChange={setBillIds}
                onSelectedTotalChange={setSelectedBillsTotal}
                searchInputId="collectPaymentBillSearch"
                firstBillFocusId="collectPaymentFirstBill"
                onSearchEnter={() => focusField("collectPaymentDate")}
                onEnterAdvance={() => focusField("collectPaymentDate")}
              />
            </aside>
          ) : null}
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