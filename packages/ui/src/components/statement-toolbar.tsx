"use client";

import { Printer, Search } from "lucide-react";

import { Button } from "./button";
import { cn } from "../lib/utils";

export interface StatementToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onPrint: () => void;
  printHref?: string;
  className?: string;
}

export function StatementToolbar({
  search,
  onSearchChange,
  onPrint,
  printHref,
  className,
}: StatementToolbarProps) {
  return (
    <div
      data-slot="statement-toolbar"
      className={cn(
        "flex flex-wrap items-center gap-3 print:hidden",
        className
      )}
    >
      <div className="relative min-w-[200px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search invoice, vehicle, remark, user…"
          className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm"
        />
      </div>
      {printHref ? (
        <Button variant="outline" asChild>
          <a href={printHref} target="_blank" rel="noopener noreferrer">
            <Printer className="size-4" />
            Print View
          </a>
        </Button>
      ) : null}
      <Button type="button" variant="outline" onClick={onPrint}>
        <Printer className="size-4" />
        Print
      </Button>
    </div>
  );
}