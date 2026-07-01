"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@punchless/ui/components/button";
import { ConfirmModal } from "@punchless/ui/components/confirm-modal";
import { Modal } from "@punchless/ui/components/modal";
import { cn } from "@punchless/ui/lib/utils";
import { BankPaymentFields } from "@/components/bank-payment-fields";
import { EntryDateHiddenInput } from "@/components/entry-date-hidden-input";
import { EntryDatePicker } from "@/components/entry-date-picker";
import { PartySearchField } from "@/components/party-search-field";
import {
  createCreditNote,
  createDebitNote,
  createDiscountSettlement,
} from "@/lib/actions/journal.actions";
import type { BankWithBalance } from "@/lib/queries/bank.queries";
import type { ClientWithDue } from "@/lib/queries/client.queries";
import type { SupplierWithPayable } from "@/lib/queries/supplier.queries";
import { useAction } from "@/hooks/use-action";
import { entityDisplayLabel } from "@/lib/utils/entity-picker";
import { formatCurrency } from "@/lib/utils/formatting";

const fieldClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

type JournalTab = "discount" | "credit";
type DiscountKind = "given" | "received";
type CreditKind = "credit_note" | "debit_note";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: ClientWithDue[];
  suppliers: SupplierWithPayable[];
  banks: BankWithBalance[];
  onSuccess?: () => void;
};

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function ToggleGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <span className="mb-2 block text-sm font-medium">{label}</span>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2.5 text-sm font-medium transition",
              value === option.value
                ? "border-primary bg-primary/10 text-foreground"
                : "border-input text-muted-foreground hover:bg-accent/50"
            )}
          >
            <input
              type="radio"
              name={label}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  );
}

export function JournalModal({
  open,
  onOpenChange,
  clients,
  suppliers,
  banks,
  onSuccess,
}: Props) {
  const [tab, setTab] = useState<JournalTab>("discount");
  const [discountKind, setDiscountKind] = useState<DiscountKind>("given");
  const [creditKind, setCreditKind] = useState<CreditKind>("credit_note");

  const [partyId, setPartyId] = useState("");
  const [partyQuery, setPartyQuery] = useState("");
  const [billId, setBillId] = useState("");
  const [selectedInvoiceNumber, setSelectedInvoiceNumber] = useState("");
  const [billDueAmount, setBillDueAmount] = useState(0);
  const [billTotalAmount, setBillTotalAmount] = useState(0);

  const [discountAmount, setDiscountAmount] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [remark, setRemark] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);

  const discountPartySide = discountKind === "given" ? "client" : "supplier";
  const discountEntities = discountKind === "given" ? clients : suppliers;

  const paymentAmount = useMemo(() => {
    const discount = Number(discountAmount) || 0;
    if (!billDueAmount || !discount) return 0;
    return roundMoney(Math.max(0, billDueAmount - discount));
  }, [billDueAmount, discountAmount]);

  useEffect(() => {
    if (!open) {
      setTab("discount");
      setDiscountKind("given");
      setCreditKind("credit_note");
      clearBillSelection();
      setDiscountAmount("");
      setCreditAmount("");
      setRemark("");
      setConfirmOpen(false);
      setPendingFormData(null);
    }
  }, [open]);

  function clearBillSelection() {
    setPartyId("");
    setPartyQuery("");
    setBillId("");
    setSelectedInvoiceNumber("");
    setBillDueAmount(0);
    setBillTotalAmount(0);
  }

  function handlePartySelect(selection: {
    partyId: string;
    billId?: string;
    invoiceNumber?: string;
    totalAmount?: number;
    outstanding?: number;
    displayQuery: string;
  }) {
    setPartyId(selection.partyId);
    setPartyQuery(selection.displayQuery);
    setBillId(selection.billId ?? "");
    setSelectedInvoiceNumber(selection.invoiceNumber ?? "");
    const due = selection.outstanding ?? selection.totalAmount ?? 0;
    setBillDueAmount(due);
    setBillTotalAmount(selection.totalAmount ?? due);
    setDiscountAmount("");
    setCreditAmount("");
  }

  const { execute: saveDiscount, loading: savingDiscount } = useAction(
    createDiscountSettlement,
    {
      successMessage: "Discount saved.",
      onSuccess: () => {
        onSuccess?.();
        onOpenChange(false);
      },
    }
  );

  const { execute: saveCreditNote, loading: savingCredit } = useAction(createCreditNote, {
    successMessage: "Credit note saved.",
    onSuccess: () => {
      onSuccess?.();
      onOpenChange(false);
    },
  });

  const { execute: saveDebitNote, loading: savingDebit } = useAction(createDebitNote, {
    successMessage: "Debit note saved.",
    onSuccess: () => {
      onSuccess?.();
      onOpenChange(false);
    },
  });

  const saving = savingDiscount || savingCredit || savingDebit;

  function buildDiscountForm(form: HTMLFormElement) {
    const formData = new FormData(form);
    formData.set("settlementKind", discountKind);
    formData.set("partySide", discountPartySide);
    formData.set("partyId", partyId);
    formData.set("billId", billId);
    formData.set("billAmount", String(billDueAmount));
    formData.set("discountAmount", discountAmount);
    return formData;
  }

  function buildCreditForm(form: HTMLFormElement) {
    const formData = new FormData(form);
    formData.set("clientId", partyId);
    formData.set("invoiceId", billId);
    formData.set("amount", creditAmount);
    return formData;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    if (!partyId || !billId) {
      toast.error("Select a party and bill");
      return;
    }

    if (tab === "discount") {
      const discount = Number(discountAmount);
      if (!discount || discount <= 0) {
        toast.error("Enter a discount amount");
        return;
      }
      if (discount >= billDueAmount) {
        toast.error("Discount must be less than the bill due amount");
        return;
      }
      setPendingFormData(buildDiscountForm(event.currentTarget));
      setConfirmOpen(true);
      return;
    }

    const amount = Number(creditAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter an amount");
      return;
    }

    if (creditKind === "credit_note" && amount > billDueAmount) {
      toast.error(`Amount cannot exceed bill due of ${formatCurrency(billDueAmount)}`);
      return;
    }

    setPendingFormData(buildCreditForm(event.currentTarget));
    setConfirmOpen(true);
  }

  async function confirmSave() {
    if (!pendingFormData) return;

    if (tab === "discount") {
      await saveDiscount(pendingFormData);
    } else if (creditKind === "credit_note") {
      await saveCreditNote(pendingFormData);
    } else {
      await saveDebitNote(pendingFormData);
    }

    setConfirmOpen(false);
    setPendingFormData(null);
  }

  const confirmDescription =
    tab === "discount"
      ? `Save discount of ${formatCurrency(Number(discountAmount) || 0)} and payment of ${formatCurrency(paymentAmount)} against ${formatCurrency(billDueAmount)} bill due?`
      : creditKind === "credit_note"
        ? `Issue credit note of ${formatCurrency(Number(creditAmount) || 0)} against bill ${selectedInvoiceNumber ? `#${selectedInvoiceNumber}` : ""}?`
        : `Issue debit note of ${formatCurrency(Number(creditAmount) || 0)} against bill ${selectedInvoiceNumber ? `#${selectedInvoiceNumber}` : ""}?`;

  return (
    <>
      <Modal
        open={open}
        onOpenChange={onOpenChange}
        title="Journal"
        headerAccessory={<EntryDatePicker />}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <ToggleGroup
            label="Entry type"
            value={tab}
            options={[
              { value: "discount", label: "Discount" },
              { value: "credit", label: "Credit" },
            ]}
            onChange={(value) => {
              setTab(value);
              clearBillSelection();
              setDiscountAmount("");
              setCreditAmount("");
              setRemark("");
            }}
          />

          {tab === "discount" ? (
            <>
              <ToggleGroup
                label="Discount type"
                value={discountKind}
                options={[
                  { value: "given", label: "Discount given" },
                  { value: "received", label: "Discount received" },
                ]}
                onChange={(value) => {
                  setDiscountKind(value);
                  clearBillSelection();
                  setDiscountAmount("");
                }}
              />

              <PartySearchField
                id="journalDiscountParty"
                label={discountKind === "given" ? "Customer" : "Supplier"}
                side={discountPartySide}
                entities={discountEntities}
                partyId={partyId}
                query={partyQuery}
                selectedInvoiceNumber={selectedInvoiceNumber}
                onQueryChange={setPartyQuery}
                onSelect={handlePartySelect}
                onClearSelection={clearBillSelection}
                allowNew={false}
              />

              <div>
                <label htmlFor="journalDiscountAmount" className="mb-1 block text-sm font-medium">
                  Discount amount (₹)
                </label>
                <input
                  id="journalDiscountAmount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  className={fieldClass}
                  disabled={!billId}
                />
                {billId ? (
                  <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                    <p>
                      Bill due:{" "}
                      <span className="font-medium text-foreground">
                        {formatCurrency(billDueAmount)}
                      </span>
                    </p>
                    {billTotalAmount > billDueAmount ? (
                      <p>
                        Bill total:{" "}
                        <span className="font-medium text-foreground">
                          {formatCurrency(billTotalAmount)}
                        </span>
                      </p>
                    ) : null}
                    {Number(discountAmount) > 0 ? (
                      <p>
                        Payment:{" "}
                        <span className="font-medium text-foreground">
                          {formatCurrency(paymentAmount)}
                        </span>
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <BankPaymentFields
                banks={banks}
                paymentModeSelectId="journalDiscountMode"
                bankSelectId="journalDiscountBankId"
                bankChannelUpiId="journalDiscountBankUpi"
                bankChannelNbId="journalDiscountBankNb"
              />
            </>
          ) : (
            <>
              <ToggleGroup
                label="Note type"
                value={creditKind}
                options={[
                  { value: "credit_note", label: "Credit note" },
                  { value: "debit_note", label: "Debit note" },
                ]}
                onChange={(value) => {
                  setCreditKind(value);
                  clearBillSelection();
                  setCreditAmount("");
                }}
              />

              <PartySearchField
                id="journalCreditParty"
                label="Customer"
                side="client"
                entities={clients}
                partyId={partyId}
                query={partyQuery}
                selectedInvoiceNumber={selectedInvoiceNumber}
                onQueryChange={setPartyQuery}
                onSelect={handlePartySelect}
                onClearSelection={clearBillSelection}
                allowNew={false}
              />

              <div>
                <label htmlFor="journalCreditAmount" className="mb-1 block text-sm font-medium">
                  {creditKind === "credit_note" ? "Credit note amount (₹)" : "Debit note amount (₹)"}
                </label>
                <input
                  id="journalCreditAmount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  className={fieldClass}
                  disabled={!billId}
                />
                {billId ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Bill due:{" "}
                    <span className="font-medium text-foreground">
                      {formatCurrency(billDueAmount)}
                    </span>
                    {creditKind === "credit_note" ? (
                      <>
                        {" · "}
                        Max credit:{" "}
                        <span className="font-medium text-foreground">
                          {formatCurrency(billDueAmount)}
                        </span>
                      </>
                    ) : null}
                  </p>
                ) : null}
              </div>
            </>
          )}

          <EntryDateHiddenInput name="entryDate" />

          <div>
            <label htmlFor="journalRemark" className="mb-1 block text-sm font-medium">
              Remark <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <input
              id="journalRemark"
              name="remark"
              type="text"
              maxLength={500}
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className={fieldClass}
            />
          </div>

          <Button type="submit" loading={saving} disabled={saving} className="w-full sm:w-auto">
            Save
          </Button>
        </form>
      </Modal>

      <ConfirmModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirm journal entry"
        description={confirmDescription}
        confirmText="Save"
        onConfirm={() => void confirmSave()}
        loading={saving}
      />
    </>
  );
}