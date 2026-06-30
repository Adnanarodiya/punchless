"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { toast } from "sonner";

import { Button } from "@punchless/ui/components/button";
import { ConfirmModal } from "@punchless/ui/components/confirm-modal";
import { Modal } from "@punchless/ui/components/modal";
import { cn } from "@punchless/ui/lib/utils";
import { AgainstBillPicker } from "@/components/against-bill-picker";
import { BankAccountField } from "@/components/bank-account-field";
import { PartySearchField } from "@/components/party-search-field";
import { SettlementTypeField } from "@/components/settlement-type-field";
import { createGeneralEntry } from "@/lib/actions/general-entry.actions";
import { createQuickCustomer } from "@/lib/actions/client.actions";
import { createQuickSupplier } from "@/lib/actions/supplier.actions";
import type { BankWithBalance } from "@/lib/queries/bank.queries";
import type { ClientWithDue } from "@/lib/queries/client.queries";
import type { SupplierWithPayable } from "@/lib/queries/supplier.queries";
import { useAction } from "@/hooks/use-action";
import {
  entityDisplayLabel,
  findEntityByQuery,
  type NamedEntity,
} from "@/lib/utils/entity-picker";
import { handleEnterToNextField } from "@/lib/utils/form-keyboard";
import { formatCurrency } from "@/lib/utils/formatting";
import type { SettlementType } from "@/lib/validations/settlement.schema";

const fieldClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: ClientWithDue[];
  suppliers: SupplierWithPayable[];
  banks: BankWithBalance[];
  onSuccess?: () => void;
};

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

type PartySide = "client" | "supplier";

export function GeneralEntryModal({
  open,
  onOpenChange,
  clients,
  suppliers,
  banks,
  onSuccess,
}: Props) {
  const [direction, setDirection] = useState<"receipt" | "payment">("receipt");
  const [paymentMode, setPaymentMode] = useState<"cash" | "bank">("cash");
  const [bankSubMode, setBankSubMode] = useState<"upi" | "net_banking" | "">("");
  const [entryKind, setEntryKind] = useState<"party" | "indirect">("party");
  const [partySide, setPartySide] = useState<PartySide>("client");
  const [partyId, setPartyId] = useState("");
  const [partyQuery, setPartyQuery] = useState("");
  const [settlementType, setSettlementType] = useState<SettlementType>("direct");
  const [billIds, setBillIds] = useState<string[]>([]);
  const [selectedBillsTotal, setSelectedBillsTotal] = useState(0);
  const [selectedInvoiceNumber, setSelectedInvoiceNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [clientOptions, setClientOptions] = useState(clients);
  const [supplierOptions, setSupplierOptions] = useState(suppliers);
  const [creatingParty, setCreatingParty] = useState(false);
  const [bankId, setBankId] = useState(banks.length === 1 ? banks[0].id : "");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);
  const [confirmAmount, setConfirmAmount] = useState(0);
  const partyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setClientOptions(clients);
    setSupplierOptions(suppliers);
  }, [clients, suppliers]);

  useEffect(() => {
    if (!open) {
      setDirection("receipt");
      setPaymentMode("cash");
      setBankSubMode("");
      setEntryKind("party");
      setPartySide("client");
      setPartyId("");
      setPartyQuery("");
      setSettlementType("direct");
      setBillIds([]);
      setSelectedBillsTotal(0);
      setSelectedInvoiceNumber("");
      setAmount("");
      setBankId("");
      setConfirmOpen(false);
      setPendingFormData(null);
      return;
    }
  }, [open]);

  useEffect(() => {
    if (paymentMode === "bank") {
      setEntryKind("party");
      if (banks.length === 1 && !bankId) {
        setBankId(banks[0].id);
      }
    }
  }, [paymentMode, banks, bankId]);

  const partyEntities = (
    partySide === "client" ? clientOptions : supplierOptions
  ) as NamedEntity[];

  const selectedParty =
    partySide === "client"
      ? clientOptions.find((c) => c.id === partyId)
      : supplierOptions.find((s) => s.id === partyId);

  const outstanding =
    partySide === "client" && selectedParty && "due_amount" in selectedParty
      ? (selectedParty as ClientWithDue).due_amount
      : partySide === "supplier" && selectedParty && "payable_amount" in selectedParty
        ? (selectedParty as SupplierWithPayable).payable_amount
        : null;

  const { execute, loading } = useAction(createGeneralEntry, {
    successMessage: direction === "receipt" ? "Receipt saved." : "Payment saved.",
    onSuccess: () => {
      onSuccess?.();
      onOpenChange(false);
    },
  });

  function selectParty(entity: NamedEntity, invoiceNumber?: string, linkedBillId?: string) {
    setPartyId(entity.id);
    setPartyQuery(
      invoiceNumber
        ? `${entityDisplayLabel(entity)} · #${invoiceNumber}`
        : entityDisplayLabel(entity)
    );
    setSelectedInvoiceNumber(invoiceNumber ?? "");
    setBillIds(linkedBillId ? [linkedBillId] : []);
  }

  function clearPartySelection() {
    setPartyId("");
    setBillIds([]);
    setSelectedBillsTotal(0);
    setSelectedInvoiceNumber("");
  }

  async function ensurePartySelected(): Promise<string | null> {
    if (partyId) return partyId;
    const name = partyQuery.trim();
    if (!name) return null;

    const exact = findEntityByQuery(partyEntities, name);
    if (exact) {
      selectParty(exact);
      return exact.id;
    }

    if (creatingParty) return null;
    setCreatingParty(true);
    try {
      const fd = new FormData();
      fd.set("name", name);
      const result =
        partySide === "client"
          ? await createQuickCustomer(fd)
          : await createQuickSupplier(fd);

      if (!result.success || !result.data) {
        toast.error(result.error || "Could not create party");
        return null;
      }

      const created = result.data as ClientWithDue | SupplierWithPayable;
      if (partySide === "client") {
        setClientOptions((prev) => [...prev, created as ClientWithDue]);
      } else {
        setSupplierOptions((prev) => [...prev, created as SupplierWithPayable]);
      }
      selectParty(created as NamedEntity);
      return created.id;
    } finally {
      setCreatingParty(false);
    }
  }

  async function buildFormData(form: HTMLFormElement): Promise<FormData | null> {
    const formData = new FormData(form);
    const resolvedEntryKind = paymentMode === "bank" ? "party" : entryKind;
    formData.set("direction", direction);
    formData.set("paymentMode", paymentMode);
    formData.set("entryKind", resolvedEntryKind);
    formData.set("settlementType", settlementType);

    if (paymentMode === "bank") {
      formData.set("bankSubMode", bankSubMode);
    } else {
      formData.set("bankSubMode", "");
    }

    if (resolvedEntryKind === "party") {
      const id = await ensurePartySelected();
      if (!id) {
        toast.error("Select or enter a party name");
        partyInputRef.current?.focus();
        return null;
      }
      if (settlementType === "against_bill" && billIds.length === 0) {
        toast.error("Select at least one bill to settle against");
        return null;
      }
      formData.set("partyId", id);
      formData.set("partySide", partySide);
    } else {
      formData.set("partyId", "");
      formData.set("partySide", "");
    }

    return formData;
  }

  async function openEntryConfirm(form: HTMLFormElement): Promise<boolean> {
    const formData = await buildFormData(form);
    if (!formData) return false;

    const payAmount = Number(formData.get("amount") || 0);
    setPendingFormData(formData);
    setConfirmAmount(payAmount);
    setConfirmOpen(true);
    return true;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || creatingParty) return;
    await openEntryConfirm(event.currentTarget);
  }

  async function handleRemarkEnter(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (loading || creatingParty) return;
    const form = event.currentTarget.form;
    if (!form) return;
    await openEntryConfirm(form);
  }

  async function confirmEntry() {
    if (!pendingFormData) return;
    await execute(pendingFormData);
    setConfirmOpen(false);
    setPendingFormData(null);
  }

  const indirectLabel = direction === "receipt" ? "Indirect Income" : "Indirect Expense";
  const isPartyEntry = paymentMode === "bank" || entryKind === "party";
  const showBillPanel =
    isPartyEntry && settlementType === "against_bill" && Boolean(partyId);

  return (
    <>
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="General entry"
      className={cn(showBillPanel && "sm:max-w-4xl")}
    >
      <form
        onSubmit={handleSubmit}
        className={cn(
          showBillPanel
            ? "grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] md:items-start"
            : "space-y-4"
        )}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Cash can be party-linked or indirect. Bank entries must link to a customer or
            supplier.
          </p>
        <div>
          <span className="mb-2 block text-sm font-medium">Receipt or payment?</span>
          <div className="grid grid-cols-2 gap-2">
            {(["receipt", "payment"] as const).map((value) => (
              <label
                key={value}
                className={cn(
                  "flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2.5 text-sm font-medium capitalize transition",
                  direction === value
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-input text-muted-foreground hover:bg-accent/50"
                )}
              >
                <input
                  type="radio"
                  name="directionUi"
                  value={value}
                  checked={direction === value}
                  onChange={() => setDirection(value)}
                  className="sr-only"
                />
                {value}
              </label>
            ))}
          </div>
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium">Cash or bank?</span>
          <div className="grid grid-cols-2 gap-2">
            {(["cash", "bank"] as const).map((value) => (
              <label
                key={value}
                className={cn(
                  "flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2.5 text-sm font-medium capitalize transition",
                  paymentMode === value
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-input text-muted-foreground hover:bg-accent/50"
                )}
              >
                <input
                  type="radio"
                  name="paymentModeUi"
                  value={value}
                  checked={paymentMode === value}
                  onChange={() => {
                    setPaymentMode(value);
                    if (value === "cash") {
                      setBankSubMode("");
                      setBankId("");
                    } else {
                      setEntryKind("party");
                    }
                  }}
                  className="sr-only"
                />
                {value}
              </label>
            ))}
          </div>
        </div>

        {paymentMode === "bank" ? (
          <div>
            <span className="mb-2 block text-sm font-medium">Bank mode</span>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { value: "upi", label: "UPI" },
                  { value: "net_banking", label: "Net banking" },
                ] as const
              ).map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2.5 text-sm font-medium transition",
                    bankSubMode === option.value
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-input text-muted-foreground hover:bg-accent/50"
                  )}
                >
                  <input
                    type="radio"
                    name="bankSubModeUi"
                    value={option.value}
                    checked={bankSubMode === option.value}
                    onChange={() => setBankSubMode(option.value)}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              ))}
            </div>
            <input type="hidden" name="bankSubMode" value={bankSubMode} />
          </div>
        ) : null}

        {paymentMode === "cash" ? (
          <div>
            <span className="mb-2 block text-sm font-medium">Party or indirect?</span>
            <div className="grid grid-cols-2 gap-2">
              <label
                className={cn(
                  "flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2.5 text-sm font-medium transition",
                  entryKind === "party"
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-input text-muted-foreground hover:bg-accent/50"
                )}
              >
                <input
                  type="radio"
                  name="entryKindUi"
                  value="party"
                  checked={entryKind === "party"}
                  onChange={() => setEntryKind("party")}
                  className="sr-only"
                />
                Party
              </label>
              <label
                className={cn(
                  "flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2.5 text-sm font-medium transition",
                  entryKind === "indirect"
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-input text-muted-foreground hover:bg-accent/50"
                )}
              >
                <input
                  type="radio"
                  name="entryKindUi"
                  value="indirect"
                  checked={entryKind === "indirect"}
                  onChange={() => {
                    setEntryKind("indirect");
                    setPartyId("");
                    setPartyQuery("");
                  }}
                  className="sr-only"
                />
                {indirectLabel}
              </label>
            </div>
          </div>
        ) : null}

        {paymentMode === "bank" ? (
          <BankAccountField
            banks={banks}
            bankId={bankId}
            onBankIdChange={setBankId}
            id="generalBankId"
          />
        ) : (
          <input type="hidden" name="bankId" value="" />
        )}

        {isPartyEntry ? (
          <SettlementTypeField
            value={settlementType}
            onChange={(value) => {
              setSettlementType(value);
              if (value === "direct") {
                setBillIds([]);
                setSelectedBillsTotal(0);
              }
            }}
          />
        ) : null}

        {isPartyEntry ? (
          <>
            <div>
              <span className="mb-2 block text-sm font-medium">Party type</span>
              <div className="grid grid-cols-2 gap-2">
                {(["client", "supplier"] as const).map((value) => (
                  <label
                    key={value}
                    className={cn(
                      "flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2.5 text-sm font-medium capitalize transition",
                      partySide === value
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-input text-muted-foreground hover:bg-accent/50"
                    )}
                  >
                    <input
                      type="radio"
                      name="partySideUi"
                      value={value}
                      checked={partySide === value}
                      onChange={() => {
                        setPartySide(value);
                        setPartyId("");
                        setPartyQuery("");
                        setBillIds([]);
                        setSelectedBillsTotal(0);
                        setSelectedInvoiceNumber("");
                        setSettlementType("direct");
                      }}
                      className="sr-only"
                    />
                      {value === "client" ? "Customer" : "Supplier"}
                  </label>
                ))}
              </div>
            </div>

            <PartySearchField
              id="generalParty"
              label="Party name"
              side={partySide}
              entities={partyEntities}
              partyId={partyId}
              query={partyQuery}
              selectedInvoiceNumber={selectedInvoiceNumber}
              onQueryChange={setPartyQuery}
              onSelect={(selection) => {
                setPartyId(selection.partyId);
                setPartyQuery(selection.displayQuery);
                setBillIds(selection.billId ? [selection.billId] : []);
                setSelectedInvoiceNumber(selection.invoiceNumber ?? "");
              }}
              onClearSelection={clearPartySelection}
              nextFieldId={
                settlementType === "against_bill" && partyId
                  ? undefined
                  : paymentMode === "cash" && entryKind === "indirect"
                    ? "generalParticular"
                    : "generalAmount"
              }
              outstandingAmount={outstanding}
              outstandingLabel="Outstanding"
              newPartyHint="New party — will be added when you save"
            />

          </>
        ) : null}

        {paymentMode === "cash" && entryKind === "indirect" ? (
          <div>
            <label htmlFor="generalParticular" className="mb-1 block text-sm font-medium">
              {direction === "receipt" ? "What was the income for?" : "What was it for?"}
            </label>
            <input
              id="generalParticular"
              name="particular"
              type="text"
              required
              maxLength={200}
              placeholder={
                direction === "receipt"
                  ? "e.g. Sold used oil, Scrap sale"
                  : "e.g. Light bill, Electrical work"
              }
              className={fieldClass}
            />
          </div>
        ) : (
          <input type="hidden" name="particular" value="" />
        )}

        <div>
          <label htmlFor="generalAmount" className="mb-1 block text-sm font-medium">
            Amount (₹)
          </label>
          <input
            id="generalAmount"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={(e) => handleEnterToNextField(e, "generalDate")}
            className={fieldClass}
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

        <div>
          <label htmlFor="generalDate" className="mb-1 block text-sm font-medium">
            Date
          </label>
          <input
            id="generalDate"
            name="entryDate"
            type="date"
            required
            defaultValue={todayDate()}
            onKeyDown={(e) => handleEnterToNextField(e, "generalRemark")}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="generalRemark" className="mb-1 block text-sm font-medium">
            Remark
          </label>
          <input
            id="generalRemark"
            name="remark"
            type="text"
            maxLength={500}
            placeholder="Optional note"
            onKeyDown={(e) => void handleRemarkEnter(e)}
            className={fieldClass}
          />
        </div>

          <Button
            type="submit"
            loading={loading || creatingParty}
            disabled={loading || creatingParty}
            className="w-full sm:w-auto sm:min-w-28"
          >
            Save
          </Button>
        </div>

        {showBillPanel ? (
          <aside className="rounded-lg border border-border bg-muted/20 p-4 md:sticky md:top-0">
            <AgainstBillPicker
              partyId={partyId}
              side={partySide}
              variant="panel"
              selectedBillIds={billIds}
              onBillsChange={setBillIds}
              onSelectedTotalChange={setSelectedBillsTotal}
              searchInputId="generalBillSearch"
            />
          </aside>
        ) : null}
      </form>
    </Modal>

    <ConfirmModal
      open={confirmOpen}
      onOpenChange={setConfirmOpen}
      title={direction === "receipt" ? "Confirm receipt" : "Confirm payment"}
      description={
        selectedParty
          ? `Save ${direction} of ${formatCurrency(confirmAmount)} for ${selectedParty.name}?`
          : `Save ${direction} of ${formatCurrency(confirmAmount)}?`
      }
      confirmText="Save"
      onConfirm={() => void confirmEntry()}
      loading={loading || creatingParty}
    />
  </>
  );
}