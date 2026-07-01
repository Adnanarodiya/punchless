"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { toast } from "sonner";

import { Button } from "@punchless/ui/components/button";
import { ConfirmModal } from "@punchless/ui/components/confirm-modal";
import { Modal } from "@punchless/ui/components/modal";
import { cn } from "@punchless/ui/lib/utils";
import { AgainstBillPicker } from "@/components/against-bill-picker";
import { BankPaymentFields } from "@/components/bank-payment-fields";
import { EntryDateHiddenInput } from "@/components/entry-date-hidden-input";
import { EntryDatePicker } from "@/components/entry-date-picker";
import { PartySearchField } from "@/components/party-search-field";
import { SettlementTypeField } from "@/components/settlement-type-field";
import { createQuickSupplier, paySupplier } from "@/lib/actions/supplier.actions";
import type { BankWithBalance } from "@/lib/queries/bank.queries";
import type { SupplierWithPayable } from "@/lib/queries/supplier.queries";
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
  suppliers: SupplierWithPayable[];
  banks: BankWithBalance[];
  initialSupplierId?: string;
  onSuccess?: () => void;
};

export function PaySupplierModal({
  open,
  onOpenChange,
  suppliers,
  banks,
  initialSupplierId = "",
  onSuccess,
}: Props) {
  const [supplierOptions, setSupplierOptions] = useState(suppliers);
  const [supplierId, setSupplierId] = useState(initialSupplierId);
  const [supplierQuery, setSupplierQuery] = useState("");
  const [settlementType, setSettlementType] = useState<SettlementType>("direct");
  const [billIds, setBillIds] = useState<string[]>([]);
  const [selectedBillsTotal, setSelectedBillsTotal] = useState(0);
  const [selectedInvoiceNumber, setSelectedInvoiceNumber] = useState("");
  const [selectedBillTotal, setSelectedBillTotal] = useState(0);
  const [billLinkedFromSearch, setBillLinkedFromSearch] = useState(false);
  const [amount, setAmount] = useState("");
  const [creatingSupplier, setCreatingSupplier] = useState(false);
  const [confirmPayOpen, setConfirmPayOpen] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<FormData | null>(null);
  const [confirmPayAmount, setConfirmPayAmount] = useState(0);
  const supplierInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSupplierOptions(suppliers);
  }, [suppliers]);

  useEffect(() => {
    if (!open) {
      setSupplierQuery("");
      setSettlementType("direct");
      setBillIds([]);
      setSelectedBillsTotal(0);
      setSelectedInvoiceNumber("");
      setSelectedBillTotal(0);
      setBillLinkedFromSearch(false);
      setAmount("");
      setConfirmPayOpen(false);
      setPendingPayment(null);
      if (!initialSupplierId) setSupplierId("");
      return;
    }

    if (initialSupplierId) {
      setSupplierId(initialSupplierId);
      const match = supplierOptions.find((s) => s.id === initialSupplierId);
      if (match) setSupplierQuery(entityDisplayLabel(match));
    }
  }, [open, initialSupplierId, supplierOptions]);

  const trimmedQuery = supplierQuery.trim();
  const isNewSupplier = isNewEntityName(supplierOptions, supplierQuery);
  const selectedSupplier = supplierOptions.find((s) => s.id === supplierId);

  const { execute: execPayment, loading: paying } = useAction(paySupplier, {
    successMessage: "Payment recorded.",
    onSuccess: () => {
      onSuccess?.();
      onOpenChange(false);
    },
  });

  function selectSupplier(
    supplier: SupplierWithPayable,
    options?: {
      invoiceNumber?: string;
      linkedBillId?: string;
      billTotal?: number;
      fromBillSearch?: boolean;
    }
  ) {
    const { invoiceNumber, linkedBillId, billTotal, fromBillSearch } = options ?? {};

    setSupplierId(supplier.id);
    setSupplierQuery(
      invoiceNumber
        ? `${entityDisplayLabel(supplier)} · #${invoiceNumber}`
        : entityDisplayLabel(supplier)
    );
    setSelectedInvoiceNumber(invoiceNumber ?? "");
    setBillIds(linkedBillId ? [linkedBillId] : []);
    setSelectedBillTotal(billTotal ?? 0);
    setBillLinkedFromSearch(Boolean(fromBillSearch && linkedBillId));
    setSettlementType(fromBillSearch && linkedBillId ? "against_bill" : "direct");
    if (!fromBillSearch) {
      setSelectedBillsTotal(0);
    }
  }

  function clearSupplierSelection() {
    setSupplierId("");
    setBillIds([]);
    setSelectedBillsTotal(0);
    setSelectedInvoiceNumber("");
    setSelectedBillTotal(0);
    setBillLinkedFromSearch(false);
    setSettlementType("direct");
  }

  async function ensureSupplierSelected(): Promise<string | null> {
    if (supplierId) return supplierId;

    const name = trimmedQuery;
    if (!name) return null;

    const exact = findEntityByQuery(supplierOptions, name);
    if (exact) {
      selectSupplier(exact, {});
      return exact.id;
    }

    if (creatingSupplier) return null;

    setCreatingSupplier(true);
    try {
      const fd = new FormData();
      fd.set("name", name);
      const result = await createQuickSupplier(fd);

      if (!result.success || !result.data) {
        toast.error(result.error || "Could not create supplier");
        return null;
      }

      const created = result.data as SupplierWithPayable;
      setSupplierOptions((prev) => [...prev, created]);
      selectSupplier(created, {});
      return created.id;
    } finally {
      setCreatingSupplier(false);
    }
  }

  async function submitPayment(formData: FormData, resolvedSupplierId: string) {
    formData.set("supplierId", resolvedSupplierId);
    formData.set(
      "settlementType",
      billLinkedFromSearch ? "against_bill" : settlementType
    );
    await execPayment(formData);
  }

  async function openPaymentConfirm(form: HTMLFormElement): Promise<boolean> {
    if (!supplierId && !trimmedQuery) {
      toast.error("Enter a supplier name");
      supplierInputRef.current?.focus();
      return false;
    }

    const effectiveSettlement = billLinkedFromSearch ? "against_bill" : settlementType;
    if (effectiveSettlement === "against_bill" && billIds.length === 0) {
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
    if (paying || creatingSupplier) return;
    await openPaymentConfirm(event.currentTarget);
  }

  async function handleRemarkEnter(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (paying || creatingSupplier) return;
    const form = event.currentTarget.form;
    if (!form) return;
    await openPaymentConfirm(form);
  }

  function focusSettlementField() {
    if (billLinkedFromSearch) {
      focusField("paySupplierRemark");
      return;
    }
    focusField("paySupplierSettlementDirect");
  }

  function focusAfterSettlement() {
    if (billLinkedFromSearch) {
      focusField("paySupplierRemark");
      return;
    }
    if (settlementType === "against_bill" && supplierId) {
      if (focusField("paySupplierBillSearch")) return;
      if (focusField("paySupplierFirstBill")) return;
    }
    focusField("paySupplierRemark");
  }

  const showBillPanel =
    settlementType === "against_bill" && Boolean(supplierId) && !billLinkedFromSearch;

  async function confirmPayment() {
    if (!pendingPayment) return;

    const resolvedSupplierId = await ensureSupplierSelected();
    if (!resolvedSupplierId) return;

    await submitPayment(pendingPayment, resolvedSupplierId);
    setConfirmPayOpen(false);
    setPendingPayment(null);
  }

  function handlePartySelect(selection: {
    partyId: string;
    partyName: string;
    billId?: string;
    invoiceNumber?: string;
    totalAmount?: number;
    displayQuery: string;
  }) {
    const supplier = supplierOptions.find((s) => s.id === selection.partyId);
    if (supplier) {
      selectSupplier(supplier, {
        invoiceNumber: selection.invoiceNumber,
        linkedBillId: selection.billId,
        billTotal: selection.totalAmount,
        fromBillSearch: Boolean(selection.billId),
      });
      return;
    }

    setSupplierId(selection.partyId);
    setSupplierQuery(selection.displayQuery);
    setBillIds(selection.billId ? [selection.billId] : []);
    setSelectedInvoiceNumber(selection.invoiceNumber ?? "");
    setSelectedBillTotal(selection.totalAmount ?? 0);
    setBillLinkedFromSearch(Boolean(selection.billId));
    setSettlementType(selection.billId ? "against_bill" : "direct");
  }

  return (
    <>
      <Modal
        open={open}
        onOpenChange={onOpenChange}
        title="Pay a supplier"
        headerAccessory={<EntryDatePicker />}
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
          <PartySearchField
            id="paySupplierSearch"
            label="Supplier"
            side="supplier"
            entities={supplierOptions}
            partyId={supplierId}
            query={supplierQuery}
            selectedInvoiceNumber={selectedInvoiceNumber}
            onQueryChange={setSupplierQuery}
            onSelect={handlePartySelect}
            onClearSelection={clearSupplierSelection}
            nextFieldId="paySupplierAmount"
            outstandingAmount={selectedSupplier?.payable_amount}
            outstandingLabel="Payable"
            newPartyHint="New supplier — will be added when you record payment"
          />

          <div>
            <label htmlFor="paySupplierAmount" className="mb-1 block text-sm font-medium">
              Amount (₹)
            </label>
            <input
              id="paySupplierAmount"
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => handleEnterToNextField(e, "paySupplierPaymentMode")}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
            {billLinkedFromSearch && selectedBillTotal > 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Bill total:{" "}
                <span className="font-medium text-foreground">
                  {formatCurrency(selectedBillTotal)}
                </span>
              </p>
            ) : settlementType === "against_bill" && selectedBillsTotal > 0 ? (
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
            paymentModeSelectId="paySupplierPaymentMode"
            bankSelectId="paySupplierBankId"
            bankChannelUpiId="paySupplierBankUpi"
            bankChannelNbId="paySupplierBankNb"
            onPaymentModeEnter={(mode) => {
              if (mode === "bank") {
                focusField("paySupplierBankUpi");
              } else {
                focusSettlementField();
              }
            }}
            onBankChannelEnter={() => focusField("paySupplierBankId")}
            onBankAccountEnter={focusSettlementField}
          />

          {billLinkedFromSearch
            ? billIds.map((id) => (
                <input key={id} type="hidden" name="billIds" value={id} />
              ))
            : null}

          {!billLinkedFromSearch ? (
            <SettlementTypeField
              idPrefix="paySupplier"
              value={settlementType}
              onChange={(value) => {
                setSettlementType(value);
                if (value === "direct") {
                  setBillIds([]);
                  setSelectedBillsTotal(0);
                  setSelectedBillTotal(0);
                }
              }}
              onEnterAdvance={focusAfterSettlement}
            />
          ) : (
            <input type="hidden" name="settlementTypeUi" value="against_bill" />
          )}

          <EntryDateHiddenInput name="paymentDate" />

          <div>
            <label htmlFor="paySupplierRemark" className="mb-1 block text-sm font-medium">
              Remark <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <input
              id="paySupplierRemark"
              name="remark"
              type="text"
              maxLength={500}
              onKeyDown={(e) => void handleRemarkEnter(e)}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>

            <Button
              type="submit"
              loading={paying || creatingSupplier}
              disabled={paying || creatingSupplier}
              className="w-full sm:w-auto"
            >
              Record payment
            </Button>
          </div>

          {showBillPanel ? (
            <aside className="rounded-lg border border-border bg-muted/20 p-4 md:sticky md:top-0">
              <AgainstBillPicker
                partyId={supplierId}
                side="supplier"
                variant="panel"
                selectedBillIds={billIds}
                onBillsChange={setBillIds}
                onSelectedTotalChange={setSelectedBillsTotal}
                searchInputId="paySupplierBillSearch"
                firstBillFocusId="paySupplierFirstBill"
                onSearchEnter={() => focusField("paySupplierRemark")}
                onEnterAdvance={() => focusField("paySupplierRemark")}
              />
            </aside>
          ) : null}
        </form>
      </Modal>

      <ConfirmModal
        open={confirmPayOpen}
        onOpenChange={setConfirmPayOpen}
        title="Confirm supplier payment"
        description={
          selectedSupplier
            ? `Pay ${formatCurrency(confirmPayAmount)} to ${selectedSupplier.name}?`
            : isNewSupplier
              ? `Pay ${formatCurrency(confirmPayAmount)} to new supplier "${trimmedQuery}"? They will be added automatically.`
              : undefined
        }
        confirmText="Confirm payment"
        onConfirm={() => void confirmPayment()}
        loading={paying || creatingSupplier}
      />
    </>
  );
}