"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";

import { Button } from "@punchless/ui/components/button";
import { cn } from "@punchless/ui/lib/utils";

import {
  todayIsoDate,
  useEntryDateStore,
} from "@/lib/stores/entry-date.store";
import { formatEntryDateDisplay } from "@/lib/utils/formatting";

type Props = {
  className?: string;
};

export function EntryDatePicker({ className }: Props) {
  const entryDate = useEntryDateStore((s) => s.entryDate);
  const hydrated = useEntryDateStore((s) => s.hydrated);
  const hydrate = useEntryDateStore((s) => s.hydrate);
  const setEntryDate = useEntryDateStore((s) => s.setEntryDate);
  const resetToToday = useEntryDateStore((s) => s.resetToToday);

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const isToday = entryDate === todayIsoDate();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!open) return;

    function handlePointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const displayDate = hydrated ? formatEntryDateDisplay(entryDate) : "Today";

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/80 bg-muted/40 px-2.5 text-sm font-medium text-foreground transition hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          !isToday && "border-primary/30 bg-primary/5"
        )}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Entry date: ${displayDate}. Click to change.`}
      >
        <CalendarDays className="size-3.5 shrink-0 text-primary" aria-hidden />
        <span className="max-w-[9.5rem] truncate">{displayDate}</span>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground transition",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Change entry date"
          className="absolute right-0 top-[calc(100%+0.35rem)] z-50 w-64 rounded-xl border border-border bg-popover p-3 shadow-lg"
        >
          <p className="text-sm font-medium text-foreground">Entry date</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Used for all entries in this session.
          </p>

          <label htmlFor="entryDatePickerInput" className="sr-only">
            Entry date
          </label>
          <input
            id="entryDatePickerInput"
            type="date"
            value={entryDate}
            onChange={(event) => setEntryDate(event.target.value)}
            className="mt-2.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          />

          <div className="mt-2.5 flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                resetToToday();
                setOpen(false);
              }}
              disabled={isToday}
            >
              Today
            </Button>
            <Button type="button" size="sm" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>

          {!isToday ? (
            <p className="mt-2.5 rounded-md bg-muted/60 px-2 py-1.5 text-xs text-muted-foreground">
              Backdated to{" "}
              <span className="font-medium text-foreground">{displayDate}</span>
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}