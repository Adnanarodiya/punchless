"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@punchless/ui/components/button";
import { ConfirmModal } from "@punchless/ui/components/confirm-modal";
import { Modal } from "@punchless/ui/components/modal";
import { PaymentModeSelect } from "@punchless/ui/components/payment-mode-select";
import { cn } from "@punchless/ui/lib/utils";
import { createQuickSupplier, paySupplier } from "@/lib/actions/supplier.actions";
import { CLIENT_PAYMENT_CONFIRM_THRESHOLD } from "@/lib/constants/payment-confirm";
import type { SupplierWithPayable } from "@/lib/queries/supplier.queries";
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
  suppliers: SupplierWithPayable[];
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
  initialSupplierId = "",
  onSuccess,
}: Props) {
  const [supplierOptions, setSupplierOptions] = useState(suppliers);
  const [supplierId, setSupplierId] = useState(initialSupplierId);
  const [supplierQuery, setSupplierQuery] = useState("");
  const [showSupplierList, setShowSupplierList] = useState(false);
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
      setShowSupplierList(false);
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

  const filteredSuppliers = useMemo(
    () => filterEntitiesByQuery(supplierOptions, supplierQuery),
    [supplierOptions, supplierQuery]
  );

  const isNewSupplier = isNewEntityName(supplierOptions, supplierQuery);
  const selectedSupplier = supplierOptions.find((s) => s.id === supplierId);

  const { execute: execPayment, loading: paying } = useAction(paySupplier, {
    successMessage: "Payment recorded.",
    onSuccess: () => {
      onSuccess?.();
      onOpenChange(false);
    },
  });

  function selectSupplier(supplier: SupplierWithPayable) {
    setSupplierId(supplier.id);
    setSupplierQuery(entityDisplayLabel(supplier));
    setShowSupplierList(false);
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
    await execPayment(formData);
  }

  async function handlePaymentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (paying || creatingSupplier) return;

    const resolvedSupplierId = await ensureSupplierSelected();
    if (!resolvedSupplierId) {
      toast.error("Enter a supplier name");
      supplierInputRef.current?.focus();
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

    await submitPayment(formData, resolvedSupplierId);
  }

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
      setShowSupplierList(false);
      if (!supplierId && trimmedQuery) {
        void ensureSupplierSelected();
      }
    }, 150);
  }

  return (
    <>
      <Modal open={open} onOpenChange={onOpenChange} title="Pay a supplier">
        <p className="mb-4 text-sm text-muted-foreground">
          Record cash or bank payment to a vendor. Search or type a new name — new suppliers are
          saved automatically.
        </p>

        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          <div className="relative">
            <label htmlFor="paySupplierSearch" className="mb-1 block text-sm font-medium">
              Supplier
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={supplierInputRef}
                id="paySupplierSearch"
                type="text"
                autoComplete="off"
                placeholder="Search or type new supplier name"
                value={supplierQuery}
                onChange={(e) => {
                  setSupplierQuery(e.target.value);
                  setSupplierId("");
                  setShowSupplierList(true);
                }}
                onFocus={() => setShowSupplierList(true)}
                onBlur={handleSupplierBlur}
                className="h-10 w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              />
            </div>

            {selectedSupplier ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Selected:{" "}
                <span className="font-medium text-foreground">{selectedSupplier.name}</span>
                {" · "}
                Payable:{" "}
                <span className="font-medium text-foreground">
                  {formatCurrency(selectedSupplier.payable_amount)}
                </span>
              </p>
            ) : isNewSupplier ? (
              <p className="mt-1 text-xs text-muted-foreground">
                New supplier — will be added when you record payment
              </p>
            ) : null}

            {showSupplierList && (filteredSuppliers.length > 0 || isNewSupplier) ? (
              <ul
                className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-border bg-popover py-1 shadow-md"
                role="listbox"
              >
                {filteredSuppliers.map((supplier) => (
                  <li key={supplier.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={supplierId === supplier.id}
                      className={cn(
                        "flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-accent",
                        supplierId === supplier.id && "bg-accent/60"
                      )}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectSupplier(supplier)}
                    >
                      <span>{entityDisplayLabel(supplier)}</span>
                      <span className="text-xs text-muted-foreground">
                        Payable {formatCurrency(supplier.payable_amount)}
                      </span>
                    </button>
                  </li>
                ))}
                {isNewSupplier && filteredSuppliers.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-muted-foreground">
                    Press Tab or save — &quot;{trimmedQuery}&quot; will be added as a new supplier
                  </li>
                ) : null}
              </ul>
            ) : null}
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
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Payment mode</label>
            <PaymentModeSelect name="paymentMode" defaultValue="cash" includeCredit={false} />
          </div>

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