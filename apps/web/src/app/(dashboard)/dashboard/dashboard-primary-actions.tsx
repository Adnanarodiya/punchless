"use client";

import { FileText, Receipt, ShoppingCart } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@punchless/ui/lib/utils";
import { useDashboardHomeModals } from "@/components/dashboard-home-modals";
import { ownerLabel } from "@/lib/i18n/owner-labels";
import { useUiLanguageStore } from "@/lib/stores/ui-language.store";

type HomeModal = "salesBill" | "purchaseBill" | "general";

type PrimaryAction = {
  labelKey: "action.salesBill" | "action.purchaseBill" | "action.general";
  icon: LucideIcon;
  iconClass: string;
  bgClass: string;
  modal: HomeModal;
};

const primaryActions: PrimaryAction[] = [
  {
    labelKey: "action.salesBill",
    icon: FileText,
    iconClass: "text-success",
    bgClass: "bg-success/15",
    modal: "salesBill",
  },
  {
    labelKey: "action.purchaseBill",
    icon: ShoppingCart,
    iconClass: "text-warning",
    bgClass: "bg-warning/15",
    modal: "purchaseBill",
  },
  {
    labelKey: "action.general",
    icon: Receipt,
    iconClass: "text-primary",
    bgClass: "bg-primary/15",
    modal: "general",
  },
];

const actionButtonClass =
  "group flex w-full flex-col items-center gap-3 rounded-xl border border-border bg-card px-4 py-5 text-center transition hover:border-primary/30 hover:bg-accent/30 hover:shadow-sm";

export function DashboardPrimaryActions() {
  const homeModals = useDashboardHomeModals();
  const language = useUiLanguageStore((s) => s.language);

  function openModal(modal: HomeModal) {
    if (modal === "salesBill") homeModals.openSalesBill();
    else if (modal === "purchaseBill") homeModals.openPurchaseBill();
    else homeModals.openGeneralEntry();
  }

  return (
    <section aria-labelledby="primary-actions-heading">
      <h2 id="primary-actions-heading" className="mb-4 text-lg font-semibold">
        Add entry
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {primaryActions.map((action) => {
          const Icon = action.icon;
          const label = ownerLabel(language, action.labelKey);
          return (
            <button
              key={action.modal}
              type="button"
              className={actionButtonClass}
              onClick={() => openModal(action.modal)}
            >
              <div
                className={cn(
                  "flex size-11 items-center justify-center rounded-xl transition",
                  action.bgClass
                )}
              >
                <Icon className={cn("size-5", action.iconClass)} />
              </div>
              <span className="text-sm font-semibold text-foreground">{label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}