import type { ReactNode } from "react";
import { Info } from "lucide-react";

import { cn } from "@punchless/ui/lib/utils";

interface InfoHintProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

/** Inline help box for jargon and “how to read this page” notes. */
export function InfoHint({ children, className, title }: InfoHintProps) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground",
        className
      )}
      role="note"
    >
      <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
      <div className="space-y-1">
        {title ? (
          <p className="font-medium text-foreground">{title}</p>
        ) : null}
        <div>{children}</div>
      </div>
    </div>
  );
}