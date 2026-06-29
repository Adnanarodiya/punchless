"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Users,
  DollarSign,
  Banknote,
  Wallet,
  Building2,
  FileText,
  Landmark,
  ShoppingCart,
  Truck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@punchless/ui/components/button";
import { cn } from "@punchless/ui/lib/utils";
import { useDashboardHomeModalsOptional } from "@/components/dashboard-home-modals";
import { useDashboardExperienceStore } from "@/lib/stores/dashboard-experience.store";

type QuickAction = {
  label: string;
  description: string;
  href?: string;
  modal?: "quickBill";
  icon: LucideIcon;
  iconClass: string;
  bgClass: string;
  borderClass: string;
  /** Hidden in Simple dashboard mode when false. */
  simpleMode?: boolean;
};

const primaryQuickActions: QuickAction[] = [
  {
    label: "Customers",
    description: "Dues & statements",
    href: "/dashboard/customers",
    icon: Building2,
    iconClass: "text-state-travel",
    bgClass: "bg-state-travel/15 group-hover:bg-state-travel/25",
    borderClass: "hover:border-state-travel/40",
  },
  {
    label: "New bill",
    description: "Quick customer bill",
    modal: "quickBill",
    icon: FileText,
    iconClass: "text-success",
    bgClass: "bg-success/15 group-hover:bg-success/25",
    borderClass: "hover:border-success/40",
  },
  {
    label: "Suppliers",
    description: "Vendors & payables",
    href: "/dashboard/suppliers",
    icon: Truck,
    iconClass: "text-warning",
    bgClass: "bg-warning/15 group-hover:bg-warning/25",
    borderClass: "hover:border-warning/40",
  },
  {
    label: "Pay staff",
    description: "Monthly payroll",
    href: "/dashboard/salary",
    icon: Banknote,
    iconClass: "text-primary",
    bgClass: "bg-primary/15 group-hover:bg-primary/25",
    borderClass: "hover:border-primary/40",
  },
  {
    label: "Employees",
    description: "Add or manage staff",
    href: "/dashboard/employees",
    icon: Users,
    iconClass: "text-state-travel",
    bgClass: "bg-state-travel/15 group-hover:bg-state-travel/25",
    borderClass: "hover:border-state-travel/40",
  },
  {
    label: "Advances",
    description: "Approve staff advances",
    href: "/dashboard/advances",
    icon: Wallet,
    iconClass: "text-warning",
    bgClass: "bg-warning/15 group-hover:bg-warning/25",
    borderClass: "hover:border-warning/40",
  },
];

const moreQuickActions: QuickAction[] = [
  {
    label: "Supplier bills",
    description: "Supplier bills & credit notes",
    href: "/dashboard/purchases",
    icon: ShoppingCart,
    iconClass: "text-state-onsite",
    bgClass: "bg-state-onsite/15 group-hover:bg-state-onsite/25",
    borderClass: "hover:border-state-onsite/40",
  },
  {
    label: "Banks",
    description: "Accounts & transfers",
    href: "/dashboard/banks",
    icon: Landmark,
    iconClass: "text-primary",
    bgClass: "bg-primary/15 group-hover:bg-primary/25",
    borderClass: "hover:border-primary/40",
  },
  {
    label: "Staff salary",
    description: "Attendance & salary report",
    href: "/dashboard/salary",
    icon: DollarSign,
    iconClass: "text-success",
    bgClass: "bg-success/15 group-hover:bg-success/25",
    borderClass: "hover:border-success/40",
  },
  {
    label: "Pay staff (history)",
    description: "Past salary payments",
    href: "/dashboard/salary/payments",
    icon: Banknote,
    iconClass: "text-primary",
    bgClass: "bg-primary/15 group-hover:bg-primary/25",
    borderClass: "hover:border-primary/40",
    simpleMode: false,
  },
];

function QuickActionTile({
  action,
  onQuickBill,
}: {
  action: QuickAction;
  onQuickBill?: () => void;
}) {
  const Icon = action.icon;
  const className = cn(
    "group rounded-xl border border-border bg-card p-3.5 text-left transition hover:shadow-sm sm:p-4",
    action.borderClass
  );
  const content = (
    <>
      <div
        className={cn(
          "mb-2.5 flex size-9 items-center justify-center rounded-lg transition sm:mb-3",
          action.bgClass
        )}
      >
        <Icon className={cn("size-4", action.iconClass)} />
      </div>
      <p className="text-sm font-medium text-foreground">{action.label}</p>
      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
        {action.description}
      </p>
    </>
  );

  if (action.modal === "quickBill" && onQuickBill) {
    return (
      <button type="button" className={className} onClick={onQuickBill}>
        {content}
      </button>
    );
  }

  return (
    <Link href={action.href ?? "/dashboard"} className={className}>
      {content}
    </Link>
  );
}

export function DashboardQuickActions() {
  const [showMore, setShowMore] = useState(false);
  const homeModals = useDashboardHomeModalsOptional();
  const experience = useDashboardExperienceStore((s) => s.experience);
  const isSimple = experience !== "full";
  const visibleMoreActions = moreQuickActions.filter(
    (action) => !isSimple || action.simpleMode !== false
  );

  return (
    <section aria-labelledby="quick-actions-heading">
      <h2 id="quick-actions-heading" className="mb-4 text-lg font-semibold">
        More shortcuts
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
        {primaryQuickActions.map((action) => (
          <QuickActionTile
            key={(action.href ?? action.modal) + action.label}
            action={action}
            onQuickBill={homeModals ? () => homeModals.openQuickBill() : undefined}
          />
        ))}
      </div>

      <div className="mt-4 flex justify-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground"
          onClick={() => setShowMore((value) => !value)}
          aria-expanded={showMore}
        >
          {showMore ? "Fewer shortcuts" : "More shortcuts"}
          <ChevronDown
            className={cn("size-4 transition-transform", showMore && "rotate-180")}
          />
        </Button>
      </div>

      {showMore && visibleMoreActions.length > 0 ? (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
          {visibleMoreActions.map((action) => (
            <QuickActionTile
              key={action.href + action.label}
              action={action}
              onQuickBill={homeModals ? () => homeModals.openQuickBill() : undefined}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}