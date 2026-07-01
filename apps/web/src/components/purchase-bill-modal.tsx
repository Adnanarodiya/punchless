"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@punchless/ui/components/button";
import { Modal } from "@punchless/ui/components/modal";
import { EntryDateHiddenInput } from "@/components/entry-date-hidden-input";
import { EntryDatePicker } from "@/components/entry-date-picker";
import { cn } from "@punchless/ui/lib/utils";
import { createQuickPurchaseBill } from "@/lib/actions/purchase.actions";
import { createQuickSupplier } from "@/lib/actions/supplier.actions";
import type { SupplierWithPayable } from "@/lib/queries/supplier.queries";
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
  suppliers: SupplierWithPayable[];
  initialSupplierId?: string;
  onSuccess?: () => void;
};

export function PurchaseBillModal({
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
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [remark, setRemark] = useState("");
  const [creatingSupplier, setCreatingSupplier] = useState(false);
  const supplierInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSupplierOptions(suppliers);
  }, [suppliers]);

  useEffect(() => {
    if (!open) {
      setSupplierQuery("");
      setShowSupplierList(false);
      setInvoiceNumber("");
      setGstNumber("");
      setAmount("");
      setRemark("");
      if (!initialSupplierId) setSupplierId("");
      return;
    }

    if (initialSupplierId) {
      setSupplierId(initialSupplierId);
      const match = supplierOptions.find((s) => s.id === initialSupplierId);
      if (match) {
        setSupplierQuery(entityDisplayLabel(match));
        setGstNumber(match.gst_number ?? "");
      }
    }
  }, [open, initialSupplierId, supplierOptions]);

  const trimmedQuery = supplierQuery.trim();

  const filteredSuppliers = useMemo(
    () => filterEntitiesByQuery(supplierOptions, supplierQuery),
    [supplierOptions, supplierQuery]
  );

  const isNewSupplier = isNewEntityName(supplierOptions, supplierQuery);
  const selectedSupplier = supplierOptions.find((s) => s.id === supplierId);

  const { execute, loading } = useAction(createQuickPurchaseBill, {
    successMessage: "Purchase bill saved.",
    onSuccess: () => {
      onSuccess?.();
      onOpenChange(false);
    },
  });

  function selectSupplier(supplier: SupplierWithPayable) {
    setSupplierId(supplier.id);
    setSupplierQuery(entityDisplayLabel(supplier));
    setGstNumber(supplier.gst_number ?? "");
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
      if (gstNumber.trim()) fd.set("gstNumber", gstNumber.trim());
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || creatingSupplier) return;

    const form = event.currentTarget;

    const id = await ensureSupplierSelected();
    if (!id) {
      toast.error("Enter a supplier name");
      supplierInputRef.current?.focus();
      return;
    }

    const formData = new FormData(form);
    formData.set("supplierId", id);
    await execute(formData);
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
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Purchase bill"
      headerAccessory={<EntryDatePicker />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="purchaseBillNumber" className="mb-1 block text-sm font-medium">
            Invoice number
          </label>
          <input
            id="purchaseBillNumber"
            name="invoiceNumber"
            type="text"
            required
            maxLength={50}
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            className={fieldClass}
          />
        </div>

        <EntryDateHiddenInput name="invoiceDate" />

        <div className="relative">
          <label htmlFor="purchaseBillSupplier" className="mb-1 block text-sm font-medium">
            Party name
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={supplierInputRef}
              id="purchaseBillSupplier"
              type="text"
              autoComplete="off"
              placeholder="Search or type supplier name"
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
            </p>
          ) : isNewSupplier ? (
            <p className="mt-1 text-xs text-muted-foreground">
              New supplier — will be added when you save
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
                      "flex w-full px-3 py-2 text-left text-sm hover:bg-accent",
                      supplierId === supplier.id && "bg-accent/60"
                    )}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectSupplier(supplier)}
                  >
                    {entityDisplayLabel(supplier)}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div>
          <label htmlFor="purchaseBillGst" className="mb-1 block text-sm font-medium">
            Party GST number{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id="purchaseBillGst"
            name="gstNumber"
            type="text"
            maxLength={20}
            value={gstNumber}
            onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="purchaseBillAmount" className="mb-1 block text-sm font-medium">
            Amount (₹)
          </label>
          <input
            id="purchaseBillAmount"
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
          <label htmlFor="purchaseBillRemark" className="mb-1 block text-sm font-medium">
            Remark <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id="purchaseBillRemark"
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
          loading={loading || creatingSupplier}
          disabled={loading || creatingSupplier}
          className="w-full sm:w-auto sm:min-w-28"
        >
          Save bill
        </Button>
      </form>
    </Modal>
  );
}