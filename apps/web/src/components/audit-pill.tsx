"use client";

import { cn } from "@punchless/ui/lib/utils";
import {
  getAuditPillClassName,
  type AuditPillTone,
} from "@/lib/utils/audit-display";

interface AuditPillProps {
  label: string;
  tone: AuditPillTone;
  className?: string;
}

export function AuditPill({ label, tone, className }: AuditPillProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        getAuditPillClassName(tone),
        className
      )}
    >
      {label}
    </span>
  );
}