"use client";

import Link from "next/link";
import {
  ArrowLeftRight,
  Banknote,
  FileText,
  HandCoins,
  Truck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@punchless/ui/lib/utils";
import { useDashboardHomeModals } from "@/components/dashboard-home-modals";
import { ownerLabel } from "@/lib/i18n/owner-labels";
import { useUiLanguageStore } from "@/lib/stores/ui-language.store";

type HomeModal = "quickBill" | "collectPayment" | "paySupplier" | "addExpense";

type PrimaryAction =
  | {
      labelKey:
        | "action.newBill"
        | "action.collectPayment"
        | "action.paySupplier"
        | "action.addExpense";
      icon: LucideIcon;
      iconClass: string;
      bgClass: string;
      modal: HomeModal;
    }
  | {
      labelKey: "action.payStaff";
      href: string;
      icon: LucideIcon;
      iconClass: string;
      bgClass: string;
    };

const primaryActions: PrimaryAction[] = [
  {
    labelKey: "action.addExpense",
    modal: "addExpense",
    icon: ArrowLeftRight,
    iconClass: "text-destructive",
    bgClass: "bg-destructive/10",
  },
  {
    labelKey: "action.newBill",
    modal: "quickBill",
    icon: FileText,
    iconClass: "text-success",
    bgClass: "bg-success/15",
  },
  {
    labelKey: "action.collectPayment",
    modal: "collectPayment",
    icon: HandCoins,
    iconClass: "text-primary",
    bgClass: "bg-primary/15",
  },
  {
    labelKey: "action.paySupplier",
    modal: "paySupplier",
    icon: Truck,
    iconClass: "text-warning",
    bgClass: "bg-warning/15",
  },
  {
    labelKey: "action.payStaff",
    href: "/dashboard/salary",
    icon: Banknote,
    iconClass: "text-state-travel",
    bgClass: "bg-state-travel/15",
  },
];

const actionButtonClass =
  "group flex w-full flex-col items-center gap-3 rounded-xl border border-border bg-card px-4 py-5 text-center transition hover:border-primary/30 hover:bg-accent/30 hover:shadow-sm";

function openModal(
  modal: HomeModal,
  handlers: {
    openQuickBill: () => void;
    openCollectPayment: () => void;
    openPaySupplier: () => void;
    openAddExpense: () => void;
  }
) {
  switch (modal) {
    case "quickBill":
      handlers.openQuickBill();
      break;
    case "collectPayment":
      handlers.openCollectPayment();
      break;
    case "paySupplier":
      handlers.openPaySupplier();
      break;
    case "addExpense":
      handlers.openAddExpense();
      break;
  }
}

export function DashboardPrimaryActions() {
  const language = useUiLanguageStore((s) => s.language);
  const { openQuickBill, openCollectPayment, openPaySupplier, openAddExpense } =
    useDashboardHomeModals();

  return (
    <section aria-labelledby="primary-actions-heading">
      <h2 id="primary-actions-heading" className="sr-only">
        Quick actions
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {primaryActions.map((action) => {
          const Icon = action.icon;
          const content = (
            <>
              <div
                className={cn(
                  "flex size-11 items-center justify-center rounded-xl transition group-hover:scale-105",
                  action.bgClass
                )}
              >
                <Icon className={cn("size-5", action.iconClass)} />
              </div>
              <span className="text-sm font-semibold">
                {ownerLabel(language, action.labelKey)}
              </span>
            </>
          );

          if ("modal" in action) {
            return (
              <button
                key={action.labelKey}
                type="button"
                className={actionButtonClass}
                onClick={() =>
                  openModal(action.modal, {
                    openQuickBill,
                    openCollectPayment,
                    openPaySupplier,
                    openAddExpense,
                  })
                }
              >
                {content}
              </button>
            );
          }

          return (
            <Link key={action.labelKey} href={action.href} className={actionButtonClass}>
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
}