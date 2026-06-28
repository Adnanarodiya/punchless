"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@punchless/ui/components/button";
import { Modal } from "@punchless/ui/components/modal";
import { cn } from "@punchless/ui/lib/utils";
import { createGeneralEntry } from "@/lib/actions/general-entry.actions";
import { createQuickCustomer } from "@/lib/actions/client.actions";
import { createQuickSupplier } from "@/lib/actions/supplier.actions";
import type { BankWithBalance } from "@/lib/queries/bank.queries";
import type { ClientWithDue } from "@/lib/queries/client.queries";
import type { SupplierWithPayable } from "@/lib/queries/supplier.queries";
import { useAction } from "@/hooks/use-action";
import {
  entityDisplayLabel,
  filterEntitiesByQuery,
  findEntityByQuery,
  type NamedEntity,
} from "@/lib/utils/entity-picker";
import { formatCurrency } from "@/lib/utils/formatting";

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
  const [showPartyList, setShowPartyList] = useState(false);
  const [clientOptions, setClientOptions] = useState(clients);
  const [supplierOptions, setSupplierOptions] = useState(suppliers);
  const [creatingParty, setCreatingParty] = useState(false);
  const [bankId, setBankId] = useState("");
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
      setBankId("");
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

  const filteredParties = useMemo(() => {
    const list = (partySide === "client" ? clientOptions : supplierOptions) as NamedEntity[];
    return filterEntitiesByQuery(list, partyQuery);
  }, [partySide, clientOptions, supplierOptions, partyQuery]);

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

  function selectParty(entity: NamedEntity) {
    setPartyId(entity.id);
    setPartyQuery(entityDisplayLabel(entity));
    setShowPartyList(false);
  }

  async function ensurePartySelected(): Promise<string | null> {
    if (partyId) return partyId;
    const name = partyQuery.trim();
    if (!name) return null;

    const list = (partySide === "client" ? clientOptions : supplierOptions) as NamedEntity[];
    const exact = findEntityByQuery(list, name);
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
      selectParty(created);
      return created.id;
    } finally {
      setCreatingParty(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || creatingParty) return;

    const formData = new FormData(event.currentTarget);
    const resolvedEntryKind = paymentMode === "bank" ? "party" : entryKind;
    formData.set("direction", direction);
    formData.set("paymentMode", paymentMode);
    formData.set("entryKind", resolvedEntryKind);

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
        return;
      }
      formData.set("partyId", id);
      formData.set("partySide", partySide);
    } else {
      formData.set("partyId", "");
      formData.set("partySide", "");
    }

    await execute(formData);
  }

  const indirectLabel = direction === "receipt" ? "Indirect Income" : "Indirect Expense";
  const isPartyEntry = paymentMode === "bank" || entryKind === "party";

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="General entry">
      <p className="mb-4 text-sm text-muted-foreground">
        Cash can be party-linked or indirect. Bank entries must link to a customer or supplier.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
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
          <div>
            <label htmlFor="generalBankId" className="mb-1 block text-sm font-medium">
              Bank account
            </label>
            {banks.length === 0 ? (
              <p className="text-sm text-destructive">
                Add a bank account under Banks before recording a bank entry.
              </p>
            ) : (
              <select
                id="generalBankId"
                name="bankId"
                required
                value={bankId}
                onChange={(e) => setBankId(e.target.value)}
                className={fieldClass}
              >
                <option value="" disabled>
                  Select bank
                </option>
                {banks.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.bank_name} — {bank.account_name}
                  </option>
                ))}
              </select>
            )}
          </div>
        ) : (
          <input type="hidden" name="bankId" value="" />
        )}

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
                      }}
                      className="sr-only"
                    />
                      {value === "client" ? "Customer" : "Supplier"}
                  </label>
                ))}
              </div>
            </div>

            <div className="relative">
              <label htmlFor="generalParty" className="mb-1 block text-sm font-medium">
                Party name
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={partyInputRef}
                  id="generalParty"
                  type="text"
                  autoComplete="off"
                  placeholder="Search party"
                  value={partyQuery}
                  onChange={(e) => {
                    setPartyQuery(e.target.value);
                    setPartyId("");
                    setShowPartyList(true);
                  }}
                  onFocus={() => setShowPartyList(true)}
                  onBlur={() => window.setTimeout(() => setShowPartyList(false), 150)}
                  className="h-10 w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                />
              </div>

              {outstanding != null && outstanding > 0 ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Outstanding:{" "}
                  <span className="font-medium text-foreground">
                    {formatCurrency(outstanding)}
                  </span>
                </p>
              ) : null}

              {showPartyList && filteredParties.length > 0 ? (
                <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-lg border border-border bg-popover py-1 shadow-md">
                  {filteredParties.map((party) => (
                    <li key={party.id}>
                      <button
                        type="button"
                        className="flex w-full px-3 py-2 text-left text-sm hover:bg-accent"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectParty(party)}
                      >
                        {entityDisplayLabel(party)}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
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
            className={fieldClass}
          />
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
      </form>
    </Modal>
  );
}