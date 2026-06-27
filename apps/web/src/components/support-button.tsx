"use client";

import { MessageCircle } from "lucide-react";

import { ownerLabel } from "@/lib/i18n/owner-labels";
import { useUiLanguageStore } from "@/lib/stores/ui-language.store";
import {
  getSupportPhoneDisplay,
  getSupportWhatsAppHref,
} from "@/lib/utils/support-contact";
import { cn } from "@punchless/ui/lib/utils";

type Props = {
  className?: string;
};

export function SupportButton({ className }: Props) {
  const language = useUiLanguageStore((s) => s.language);
  const phone = getSupportPhoneDisplay();

  if (!phone) {
    return null;
  }

  const href = getSupportWhatsAppHref(phone);
  const label = ownerLabel(language, "support.needHelp");

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={cn(
        "fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full border border-success/30 bg-success px-4 py-3 text-sm font-medium text-success-foreground shadow-lg transition hover:bg-success/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
    >
      <MessageCircle className="size-5 shrink-0" aria-hidden />
      <span className="hidden sm:inline">{label}</span>
    </a>
  );
}