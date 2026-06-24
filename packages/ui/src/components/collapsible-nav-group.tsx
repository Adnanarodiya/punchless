"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "../lib/utils";

export interface CollapsibleNavGroupProps {
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function CollapsibleNavGroup({
  label,
  defaultOpen = true,
  children,
  className,
}: CollapsibleNavGroupProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  const panelId = React.useId();

  return (
    <div data-slot="collapsible-nav-group" className={cn("space-y-1", className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
      >
        <span>{label}</span>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 transition-transform",
            open ? "rotate-0" : "-rotate-90"
          )}
          aria-hidden
        />
      </button>
      <div
        id={panelId}
        className={cn("space-y-0.5", !open && "hidden")}
      >
        {children}
      </div>
    </div>
  );
}