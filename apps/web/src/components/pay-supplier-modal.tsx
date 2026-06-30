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

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

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
    invoiceNumber?: string,
    linkedBillId?: string
  ) {
    setSupplierId(supplier.id);
    setSupplierQuery(
      invoiceNumber
        ? `${entityDisplayLabel(supplier)} · #${invoiceNumber}`
        : entityDisplayLabel(supplier)
    );
    setSelectedInvoiceNumber(invoiceNumber ?? "");
    setBillIds(linkedBillId ? [linkedBillId] : []);
  }

  function clearSupplierSelection() {
    setSupplierId("");
    setBillIds([]);
    setSelectedBillsTotal(0);
    setSelectedInvoiceNumber("");
  }

  async function ensureSupplierSelected(): Promise<string | null> {
    if (supplierId) return supplierId;

    const name = trimmedQuery;
    if (!name) return null;

    const exact = findEntityByQuery(supplierOptions, name);
    if (exact) {
      selectSupplier(exact);
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
      selectSupplier(created);
      return created.id;
    } finally {
      setCreatingSupplier(false);
    }
  }

  async function submitPayment(formData: FormData, resolvedSupplierId: string) {
    formData.set("supplierId", resolvedSupplierId);
    formData.set("settlementType", settlementType);
    await execPayment(formData);
  }

  async function openPaymentConfirm(form: HTMLFormElement): Promise<boolean> {
    const resolvedSupplierId = await ensureSupplierSelected();
    if (!resolvedSupplierId) {
      toast.error("Enter a supplier name");
      supplierInputRef.current?.focus();
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
    focusField("paySupplierSettlementDirect");
  }

  function focusAfterSettlement() {
    if (settlementType === "against_bill" && supplierId) {
      if (focusField("paySupplierBillSearch")) return;
      if (focusField("paySupplierFirstBill")) return;
    }
    focusField("paySupplierDate");
  }

  const showBillPanel = settlementType === "against_bill" && Boolean(supplierId);

  async function confirmPayment() {
    if (!pendingPayment) return;

    const resolvedSupplierId = await ensureSupplierSelected();
    if (!resolvedSupplierId) return;

    await submitPayment(pendingPayment, resolvedSupplierId);
    setConfirmPayOpen(false);
    setPendingPayment(null);
  }

  function handleSupplierBlur() {
    window.setTimeout(() => {
      if (!supplierId && trimmedQuery) {
        void ensureSupplierSelected();
      }
    }, 150);
  }

  return (
    <>
      <Modal
        open={open}
        onOpenChange={onOpenChange}
        title="Pay a supplier"
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
              Record cash or bank payment to a vendor. Search by party name or bill number.
            </p>
          <div onBlur={handleSupplierBlur}>
            <PartySearchField
              id="paySupplierSearch"
              label="Supplier"
              side="supplier"
              entities={supplierOptions}
              partyId={supplierId}
              query={supplierQuery}
              selectedInvoiceNumber={selectedInvoiceNumber}
              onQueryChange={setSupplierQuery}
              onSelect={(selection) => {
                const supplier = supplierOptions.find((s) => s.id === selection.partyId);
                if (supplier) {
                  selectSupplier(
                    supplier,
                    selection.invoiceNumber,
                    selection.billId
                  );
                } else {
                  setSupplierId(selection.partyId);
                  setSupplierQuery(selection.displayQuery);
                  setBillIds(selection.billId ? [selection.billId] : []);
                  setSelectedInvoiceNumber(selection.invoiceNumber ?? "");
                }
              }}
              onClearSelection={clearSupplierSelection}
              nextFieldId="paySupplierAmount"
              outstandingAmount={selectedSupplier?.payable_amount}
              outstandingLabel="Payable"
              newPartyHint="New supplier — will be added when you record payment"
            />
          </div>

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

          <SettlementTypeField
            idPrefix="paySupplier"
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
            <label htmlFor="paySupplierDate" className="mb-1 block text-sm font-medium">
              Payment date
            </label>
            <input
              id="paySupplierDate"
              name="paymentDate"
              type="date"
              required
              defaultValue={todayDate()}
              onKeyDown={(e) => handleEnterToNextField(e, "paySupplierRemark")}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>

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
                onSearchEnter={() => focusField("paySupplierDate")}
                onEnterAdvance={() => focusField("paySupplierDate")}
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