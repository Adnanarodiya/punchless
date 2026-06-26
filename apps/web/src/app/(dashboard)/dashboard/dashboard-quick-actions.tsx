import Link from "next/link";
import {
  Users,
  Briefcase,
  Clock,
  DollarSign,
  FileEdit,
  Wallet,
  MapPin,
  History,
  Building2,
  FileText,
  Landmark,
  ArrowLeftRight,
  ShoppingCart,
  Truck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@punchless/ui/lib/utils";

type QuickAction = {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  iconClass: string;
  bgClass: string;
  borderClass: string;
};

const quickActions: QuickAction[] = [
  {
    label: "Clients",
    description: "CRM & client dues",
    href: "/dashboard/clients",
    icon: Building2,
    iconClass: "text-state-travel",
    bgClass: "bg-state-travel/15 group-hover:bg-state-travel/25",
    borderClass: "hover:border-state-travel/40",
  },
  {
    label: "Invoices",
    description: "GST tax invoices",
    href: "/dashboard/invoices",
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
    label: "Purchases",
    description: "Purchase invoices",
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
    label: "Transactions",
    description: "Income & expense",
    href: "/dashboard/transactions",
    icon: ArrowLeftRight,
    iconClass: "text-destructive",
    bgClass: "bg-destructive/10 group-hover:bg-destructive/20",
    borderClass: "hover:border-destructive/30",
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
    label: "Workshops",
    description: "Locations & geofence",
    href: "/dashboard/workshops",
    icon: MapPin,
    iconClass: "text-success",
    bgClass: "bg-success/15 group-hover:bg-success/25",
    borderClass: "hover:border-success/40",
  },
  {
    label: "Jobs",
    description: "Create & assign jobs",
    href: "/dashboard/jobs",
    icon: Briefcase,
    iconClass: "text-warning",
    bgClass: "bg-warning/15 group-hover:bg-warning/25",
    borderClass: "hover:border-warning/40",
  },
  {
    label: "Attendance",
    description: "Live & manual sessions",
    href: "/dashboard/attendance",
    icon: Clock,
    iconClass: "text-state-onsite",
    bgClass: "bg-state-onsite/15 group-hover:bg-state-onsite/25",
    borderClass: "hover:border-state-onsite/40",
  },
  {
    label: "History",
    description: "Employee time logs",
    href: "/dashboard/history",
    icon: History,
    iconClass: "text-primary",
    bgClass: "bg-primary/15 group-hover:bg-primary/25",
    borderClass: "hover:border-primary/40",
  },
  {
    label: "Requests",
    description: "Correction approvals",
    href: "/dashboard/requests",
    icon: FileEdit,
    iconClass: "text-destructive",
    bgClass: "bg-destructive/10 group-hover:bg-destructive/20",
    borderClass: "hover:border-destructive/30",
  },
  {
    label: "Salary",
    description: "Monthly payroll report",
    href: "/dashboard/salary",
    icon: DollarSign,
    iconClass: "text-success",
    bgClass: "bg-success/15 group-hover:bg-success/25",
    borderClass: "hover:border-success/40",
  },
  {
    label: "Advances",
    description: "Approve advance requests",
    href: "/dashboard/advances",
    icon: Wallet,
    iconClass: "text-warning",
    bgClass: "bg-warning/15 group-hover:bg-warning/25",
    borderClass: "hover:border-warning/40",
  },
];

export function DashboardQuickActions() {
  return (
    <section aria-labelledby="quick-actions-heading">
      <h2 id="quick-actions-heading" className="mb-4 text-lg font-semibold">
        Quick Actions
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className={cn(
                "group rounded-xl border border-border bg-card p-3.5 transition hover:shadow-sm sm:p-4",
                action.borderClass
              )}
            >
              <div
                className={cn(
                  "mb-2.5 flex size-9 items-center justify-center rounded-lg transition sm:mb-3",
                  action.bgClass
                )}
              >
                <Icon className={cn("size-4", action.iconClass)} />
              </div>
              <p className="text-sm font-medium text-foreground">
                {action.label}
              </p>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                {action.description}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}