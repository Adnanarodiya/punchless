"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Search } from "lucide-react";

import { cn } from "@punchless/ui/lib/utils";
import type { PartySearchResult } from "@/lib/types/party-bill.types";
import {
  entityDisplayLabel,
  filterEntitiesByQuery,
  findEntityByQuery,
  isNewEntityName,
  type NamedEntity,
} from "@/lib/utils/entity-picker";
import { handleEnterToNextField } from "@/lib/utils/form-keyboard";
import { formatCurrency } from "@/lib/utils/formatting";

export type PartySelection = {
  partyId: string;
  partyName: string;
  billId?: string;
  invoiceNumber?: string;
  totalAmount?: number;
  displayQuery: string;
};

type Props = {
  id: string;
  label: string;
  placeholder?: string;
  side: "client" | "supplier";
  entities: NamedEntity[];
  partyId: string;
  query: string;
  selectedInvoiceNumber?: string;
  onQueryChange: (query: string) => void;
  onSelect: (selection: PartySelection) => void;
  onClearSelection: () => void;
  nextFieldId?: string;
  outstandingAmount?: number | null;
  outstandingLabel?: string;
  allowNew?: boolean;
  newPartyHint?: string;
};

function partyWithBillLabel(partyName: string, invoiceNumber?: string) {
  if (!invoiceNumber) return partyName;
  return `${partyName} · #${invoiceNumber}`;
}

function isDigitOnlyQuery(query: string) {
  return /^\d+$/.test(query);
}

export function PartySearchField({
  id,
  label,
  placeholder = "Search by party name or bill number",
  side,
  entities,
  partyId,
  query,
  selectedInvoiceNumber,
  onQueryChange,
  onSelect,
  onClearSelection,
  nextFieldId,
  outstandingAmount,
  outstandingLabel = "Outstanding",
  allowNew = true,
  newPartyHint,
}: Props) {
  const [showList, setShowList] = useState(false);
  const [remoteResults, setRemoteResults] = useState<PartySearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const trimmedQuery = query.trim();
  const digitOnlyQuery = isDigitOnlyQuery(trimmedQuery);

  const localParties = useMemo(
    () => filterEntitiesByQuery(entities, query, 6),
    [entities, query]
  );

  const isNewParty = allowNew && isNewEntityName(entities, query);

  useEffect(() => {
    if (!trimmedQuery) {
      setRemoteResults([]);
      return;
    }

    const timer = window.setTimeout(() => {
      setSearching(true);
      void fetch(`/api/party-search?q=${encodeURIComponent(trimmedQuery)}&side=${side}`)
        .then((res) => res.json())
        .then((data: { results?: PartySearchResult[] }) => {
          setRemoteResults(data.results ?? []);
        })
        .finally(() => setSearching(false));
    }, 200);

    return () => window.clearTimeout(timer);
  }, [trimmedQuery, side]);

  const dropdownItems = useMemo(() => {
    const items: Array<{
      key: string;
      label: string;
      sublabel?: string;
      onPick: () => void;
    }> = [];

    const localIds = new Set(localParties.map((p) => p.id));

    for (const party of localParties) {
      items.push({
        key: `party-${party.id}`,
        label: entityDisplayLabel(party),
        onPick: () => {
          onSelect({
            partyId: party.id,
            partyName: party.name,
            displayQuery: entityDisplayLabel(party),
          });
          setShowList(false);
        },
      });
    }

    for (const result of remoteResults) {
      if (result.type === "party") {
        if (localIds.has(result.partyId)) continue;
        items.push({
          key: `party-${result.partyId}`,
          label: result.label,
          onPick: () => {
            onSelect({
              partyId: result.partyId,
              partyName: result.name,
              displayQuery: result.label,
            });
            setShowList(false);
          },
        });
      } else {
        items.push({
          key: `bill-${result.billId}`,
          label: result.label,
          sublabel: `Bill total ${formatCurrency(result.totalAmount)}`,
          onPick: () => {
            const partyLabel = entityDisplayLabel({
              name: result.partyName,
              alias: result.partyAlias,
            });
            onSelect({
              partyId: result.partyId,
              partyName: result.partyName,
              billId: result.billId,
              invoiceNumber: result.invoiceNumber,
              totalAmount: result.totalAmount,
              displayQuery: partyWithBillLabel(partyLabel, result.invoiceNumber),
            });
            setShowList(false);
          },
        });
      }
    }

    return items.slice(0, 10);
  }, [localParties, remoteResults, onSelect]);

  const showNewPartyHint =
    allowNew &&
    !partyId &&
    trimmedQuery.length > 0 &&
    !digitOnlyQuery &&
    isNewParty &&
    dropdownItems.length === 0 &&
    !searching;

  function handleChange(value: string) {
    onQueryChange(value);
    onClearSelection();
    setShowList(true);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();

      if (showList && dropdownItems.length > 0) {
        dropdownItems[0].onPick();
        focusNextFieldAfterSelect();
        return;
      }

      const exact = findEntityByQuery(entities, trimmedQuery);
      if (exact) {
        onSelect({
          partyId: exact.id,
          partyName: exact.name,
          displayQuery: entityDisplayLabel(exact),
        });
        setShowList(false);
        focusNextFieldAfterSelect();
        return;
      }

      handleEnterToNextField(event, nextFieldId);
      return;
    }

    if (event.key === "Escape") {
      setShowList(false);
    }
  }

  function focusNextFieldAfterSelect() {
    window.setTimeout(() => {
      if (nextFieldId) {
        document.getElementById(nextFieldId)?.focus();
      }
    }, 0);
  }

  const selectedEntity = entities.find((e) => e.id === partyId);
  const displaySelected = partyId
    ? partyWithBillLabel(
        selectedEntity ? entityDisplayLabel(selectedEntity) : query,
        selectedInvoiceNumber
      )
    : null;

  return (
    <div className="relative">
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          id={id}
          type="text"
          autoComplete="off"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setShowList(true)}
          onBlur={() => window.setTimeout(() => setShowList(false), 150)}
          onKeyDown={handleKeyDown}
          className="h-10 w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        />
      </div>

      {partyId && displaySelected ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Selected:{" "}
          <span className="font-medium text-foreground">{displaySelected}</span>
          {outstandingAmount != null && outstandingAmount > 0 ? (
            <>
              {" · "}
              {outstandingLabel}:{" "}
              <span className="font-medium text-foreground">
                {formatCurrency(outstandingAmount)}
              </span>
            </>
          ) : null}
        </p>
      ) : showNewPartyHint ? (
        <p className="mt-1 text-xs text-muted-foreground">
          {newPartyHint ?? `New party — will be added when you save`}
        </p>
      ) : null}

      {showList && (dropdownItems.length > 0 || searching) ? (
        <ul
          className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-border bg-popover py-1 shadow-md"
          role="listbox"
        >
          {searching && dropdownItems.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">Searching…</li>
          ) : null}
          {dropdownItems.map((item) => (
            <li key={item.key}>
              <button
                type="button"
                role="option"
                className={cn(
                  "flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-accent"
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  item.onPick();
                  focusNextFieldAfterSelect();
                }}
              >
                <span>{item.label}</span>
                {item.sublabel ? (
                  <span className="text-xs text-muted-foreground">{item.sublabel}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}