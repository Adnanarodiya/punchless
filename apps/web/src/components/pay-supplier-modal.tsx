"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Plus, Search } from "lucide-react";
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

function supplierLabel(supplier: Pick<SupplierWithPayable, "name" | "alias">) {
  return supplier.alias ? `${supplier.name} (${supplier.alias})` : supplier.name;
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
      if (match) setSupplierQuery(supplierLabel(match));
    }
  }, [open, initialSupplierId, supplierOptions]);

  const filteredSuppliers = useMemo(() => {
    const query = supplierQuery.trim().toLowerCase();
    const active = supplierOptions.filter((s) => !s.is_deleted);
    if (!query) return active.slice(0, 8);
    return active
      .filter(
        (supplier) =>
          supplier.name.toLowerCase().includes(query) ||
          (supplier.alias?.toLowerCase().includes(query) ?? false)
      )
      .slice(0, 8);
  }, [supplierOptions, supplierQuery]);

  const trimmedQuery = supplierQuery.trim();
  const canCreateSupplier =
    trimmedQuery.length > 0 &&
    !supplierOptions.some(
      (supplier) => supplier.name.toLowerCase() === trimmedQuery.toLowerCase()
    );

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
    setSupplierQuery(supplierLabel(supplier));
    setShowSupplierList(false);
  }

  async function handleCreateSupplier() {
    const name = trimmedQuery;
    if (!name || creatingSupplier) return;

    setCreatingSupplier(true);
    try {
      const fd = new FormData();
      fd.set("name", name);
      const result = await createQuickSupplier(fd);

      if (!result.success || !result.data) {
        toast.error(result.error || "Could not create supplier");
        return;
      }

      const created = result.data as SupplierWithPayable;
      setSupplierOptions((prev) => [...prev, created]);
      selectSupplier(created);
      toast.success(`Supplier "${name}" added`);
    } finally {
      setCreatingSupplier(false);
    }
  }

  async function submitPayment(formData: FormData) {
    if (!supplierId) return;
    formData.set("supplierId", supplierId);
    await execPayment(formData);
  }

  function handlePaymentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supplierId || paying) {
      toast.error("Select or create a supplier first");
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

    void submitPayment(formData);
  }

  async function confirmPayment() {
    if (!pendingPayment) return;
    await submitPayment(pendingPayment);
    setConfirmPayOpen(false);
    setPendingPayment(null);
  }

  return (
    <>
      <Modal open={open} onOpenChange={onOpenChange} title="Pay a supplier">
        <p className="mb-4 text-sm text-muted-foreground">
          Record cash or bank payment to a vendor. Search a supplier or type a new name.
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
                onBlur={() => {
                  window.setTimeout(() => {
                    setShowSupplierList(false);
                    if (!supplierId && trimmedQuery) {
                      const exact = supplierOptions.find(
                        (supplier) =>
                          supplier.name.toLowerCase() === trimmedQuery.toLowerCase()
                      );
                      if (exact) selectSupplier(exact);
                    }
                  }, 150);
                }}
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
            ) : null}

            {showSupplierList && (filteredSuppliers.length > 0 || canCreateSupplier) ? (
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
                      <span>{supplierLabel(supplier)}</span>
                      <span className="text-xs text-muted-foreground">
                        Payable {formatCurrency(supplier.payable_amount)}
                      </span>
                    </button>
                  </li>
                ))}
                {canCreateSupplier ? (
                  <li>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-primary hover:bg-accent"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={handleCreateSupplier}
                      disabled={creatingSupplier}
                    >
                      <Plus className="size-3.5 shrink-0" />
                      {creatingSupplier ? "Adding…" : `Add supplier "${trimmedQuery}"`}
                    </button>
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

          <Button type="submit" loading={paying} disabled={paying} className="w-full sm:w-auto">
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
            : undefined
        }
        confirmText="Confirm payment"
        onConfirm={() => void confirmPayment()}
        loading={paying}
      />
    </>
  );
}