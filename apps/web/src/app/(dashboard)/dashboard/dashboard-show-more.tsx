"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { Button } from "@punchless/ui/components/button";
import { cn } from "@punchless/ui/lib/utils";

interface Props {
  children: ReactNode;
}

export function DashboardShowMore({ children }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <section aria-labelledby="show-more-heading" className="space-y-4">
      <div className="flex items-center justify-center border-t border-border pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="dashboard-show-more-panel"
          className="gap-2"
        >
          {open ? "Show less" : "Show more"}
          <ChevronDown
            className={cn("size-4 transition-transform", open && "rotate-180")}
          />
        </Button>
      </div>

      {open ? (
        <div id="dashboard-show-more-panel" className="space-y-8">
          {children}
        </div>
      ) : null}
    </section>
  );
}