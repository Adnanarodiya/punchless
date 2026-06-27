"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { Button } from "@punchless/ui/components/button";
import { cn } from "@punchless/ui/lib/utils";
import {
  PAGE_FIRST_VISIT_TIPS,
  type PageTipId,
} from "@/lib/content/page-first-visit-tips";

function storageKey(pageId: PageTipId) {
  return `punchless-tip-dismissed-${pageId}`;
}

interface Props {
  pageId: PageTipId;
  className?: string;
}

/** P2-1 — Dismissible ~30s tip on first visit to key pages. */
export function PageFirstVisitTip({ pageId, className }: Props) {
  const [visible, setVisible] = useState(false);
  const tip = PAGE_FIRST_VISIT_TIPS[pageId];

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(storageKey(pageId));
      if (!dismissed) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, [pageId]);

  function dismiss() {
    try {
      localStorage.setItem(storageKey(pageId), "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className={cn(
        "relative rounded-xl border border-primary/25 bg-primary/5 p-4 pr-12",
        className
      )}
      role="note"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 size-8"
        onClick={dismiss}
        aria-label="Dismiss tip"
      >
        <X className="size-4" />
      </Button>
      <p className="text-sm font-semibold text-foreground">{tip.title}</p>
      <p className="mt-1 text-xs text-muted-foreground">~30 second read</p>
      <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
        {tip.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-4"
        onClick={dismiss}
      >
        Got it
      </Button>
    </div>
  );
}