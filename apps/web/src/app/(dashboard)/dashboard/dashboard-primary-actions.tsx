"use client";

import { Banknote, BookOpen, FileText, Receipt, ShoppingCart } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@punchless/ui/lib/utils";
import { useDashboardHomeModals } from "@/components/dashboard-home-modals";
import { ownerLabel } from "@/lib/i18n/owner-labels";
import { useUiLanguageStore } from "@/lib/stores/ui-language.store";

type HomeModal = "salesBill" | "purchaseBill" | "collectPayment" | "paySupplier" | "general";

type PrimaryAction = {
  labelKey:
    | "action.salesBill"
    | "action.purchaseBill"
    | "action.receipt"
    | "action.payment"
    | "action.journal";
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
    labelKey: "action.receipt",
    icon: Receipt,
    iconClass: "text-primary",
    bgClass: "bg-primary/15",
    modal: "collectPayment",
  },
  {
    labelKey: "action.payment",
    icon: Banknote,
    iconClass: "text-destructive",
    bgClass: "bg-destructive/10",
    modal: "paySupplier",
  },
  {
    labelKey: "action.journal",
    icon: BookOpen,
    iconClass: "text-violet-600",
    bgClass: "bg-violet-600/15",
    modal: "general",
  },
];

const actionButtonClass =
  "group flex w-full flex-col items-center gap-2.5 rounded-xl border border-border bg-card px-2 py-4 text-center transition hover:border-primary/30 hover:bg-accent/30 hover:shadow-sm";

export function DashboardPrimaryActions() {
  const homeModals = useDashboardHomeModals();
  const language = useUiLanguageStore((s) => s.language);

  function openModal(modal: HomeModal) {
    if (modal === "salesBill") homeModals.openSalesBill();
    else if (modal === "purchaseBill") homeModals.openPurchaseBill();
    else if (modal === "collectPayment") homeModals.openCollectPayment();
    else if (modal === "paySupplier") homeModals.openPaySupplier();
    else homeModals.openGeneralEntry();
  }

  return (
    <section aria-labelledby="primary-actions-heading">
      <h2 id="primary-actions-heading" className="mb-4 text-lg font-semibold">
        Add entry
      </h2>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
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
                  "flex size-10 items-center justify-center rounded-xl transition",
                  action.bgClass
                )}
              >
                <Icon className={cn("size-5", action.iconClass)} />
              </div>
              <span className="text-xs font-semibold leading-tight text-foreground">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
