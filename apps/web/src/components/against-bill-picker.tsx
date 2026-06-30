"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Search } from "lucide-react";

import { cn } from "@punchless/ui/lib/utils";
import type { OutstandingBill } from "@/lib/types/party-bill.types";
import { focusField } from "@/lib/utils/form-keyboard";
import { formatCurrency } from "@/lib/utils/formatting";

const fieldClass =
  "h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

type Props = {
  partyId: string;
  side: "client" | "supplier";
  selectedBillIds: string[];
  onBillsChange: (billIds: string[]) => void;
  onSelectedTotalChange?: (total: number) => void;
  variant?: "inline" | "panel";
  searchInputId?: string;
  firstBillFocusId?: string;
  onSearchEnter?: () => void;
  onEnterAdvance?: () => void;
};

export function AgainstBillPicker({
  partyId,
  side,
  selectedBillIds,
  onBillsChange,
  onSelectedTotalChange,
  variant = "inline",
  searchInputId,
  firstBillFocusId,
  onSearchEnter,
  onEnterAdvance,
}: Props) {
  const [bills, setBills] = useState<OutstandingBill[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const onBillsChangeRef = useRef(onBillsChange);
  const onSelectedTotalChangeRef = useRef(onSelectedTotalChange);
  const selectedBillIdsRef = useRef(selectedBillIds);

  onBillsChangeRef.current = onBillsChange;
  onSelectedTotalChangeRef.current = onSelectedTotalChange;
  selectedBillIdsRef.current = selectedBillIds;

  useEffect(() => {
    setSearchQuery("");
  }, [partyId]);

  useEffect(() => {
    if (!partyId) {
      setBills([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void fetch(`/api/party-bills?partyId=${partyId}&side=${side}`)
      .then((res) => res.json())
      .then((data: { bills?: OutstandingBill[] }) => {
        if (cancelled) return;
        const list = data.bills ?? [];
        setBills(list);

        const currentIds = selectedBillIdsRef.current;
        const validIds = currentIds.filter((id) =>
          list.some((bill) => bill.id === id)
        );
        if (validIds.length !== currentIds.length) {
          onBillsChangeRef.current(validIds);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [partyId, side]);

  const filteredBills = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return bills;
    return bills.filter((bill) =>
      (bill.invoiceNumber ?? "").toLowerCase().includes(query)
    );
  }, [bills, searchQuery]);

  const selectedTotal = useMemo(
    () =>
      bills
        .filter((bill) => selectedBillIds.includes(bill.id))
        .reduce((sum, bill) => sum + bill.outstanding, 0),
    [bills, selectedBillIds]
  );

  useEffect(() => {
    onSelectedTotalChangeRef.current?.(Math.round(selectedTotal * 100) / 100);
  }, [selectedTotal]);

  function toggleBill(billId: string) {
    if (selectedBillIds.includes(billId)) {
      onBillsChange(selectedBillIds.filter((id) => id !== billId));
    } else {
      onBillsChange([...selectedBillIds, billId]);
    }
  }

  function handleSearchEnter(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();

    if (filteredBills.length === 1) {
      const bill = filteredBills[0];
      if (!selectedBillIds.includes(bill.id)) {
        onBillsChange([...selectedBillIds, bill.id]);
      }
    }

    if (firstBillFocusId && focusField(firstBillFocusId)) return;
    onSearchEnter?.();
  }

  if (!partyId) return null;

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">Loading outstanding bills…</p>
    );
  }

  if (bills.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No unsettled bills for this party. Switch to Direct or record against running
        balance.
      </p>
    );
  }

  const isPanel = variant === "panel";

  return (
    <div className={cn(isPanel && "flex min-h-0 flex-col")}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-sm font-medium">
          {isPanel ? "Unsettled bills" : "Select bills"}
        </span>
        <span className="shrink-0 text-xs text-muted-foreground">
          {selectedBillIds.length > 0
            ? `${selectedBillIds.length} selected · ${bills.length} total`
            : `${bills.length} bill${bills.length === 1 ? "" : "s"}`}
        </span>
      </div>

      {isPanel ? (
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id={searchInputId}
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onKeyDown={handleSearchEnter}
            placeholder="Search by bill number…"
            className={fieldClass}
            autoComplete="off"
          />
        </div>
      ) : null}

      <div
        className={cn(
          "space-y-2 overflow-auto rounded-lg border border-border p-2",
          isPanel ? "max-h-[min(420px,50dvh)]" : "max-h-48"
        )}
      >
        {filteredBills.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No bills match &ldquo;{searchQuery.trim()}&rdquo;
          </p>
        ) : (
          filteredBills.map((bill, index) => {
            const label = bill.invoiceNumber ? `#${bill.invoiceNumber}` : "Bill";
            const selected = selectedBillIds.includes(bill.id);
            const isFirstFocusTarget = index === 0 && firstBillFocusId;

            return (
              <label
                key={bill.id}
                id={isFirstFocusTarget ? firstBillFocusId : undefined}
                tabIndex={isFirstFocusTarget ? 0 : undefined}
                onKeyDown={
                  isFirstFocusTarget
                    ? (event) => {
                        if (event.key !== "Enter") return;
                        event.preventDefault();
                        onEnterAdvance?.();
                      }
                    : undefined
                }
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                  selected
                    ? "border-primary bg-primary/10"
                    : "border-input hover:bg-accent/50"
                )}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggleBill(bill.id)}
                  className="mt-1"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="text-xs text-muted-foreground">
                    {bill.invoiceDate}
                    {" · "}
                    Total {formatCurrency(bill.totalAmount)}
                    {" · "}
                    Due {formatCurrency(bill.outstanding)}
                  </span>
                </span>
              </label>
            );
          })
        )}
      </div>

      {selectedBillIds.length > 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Selected bills total due:{" "}
          <span className="font-medium text-foreground">
            {formatCurrency(selectedTotal)}
          </span>
        </p>
      ) : null}

      {selectedBillIds.map((id) => (
        <input key={id} type="hidden" name="billIds" value={id} />
      ))}
    </div>
  );
}