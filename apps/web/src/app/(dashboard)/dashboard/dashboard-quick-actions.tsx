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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const quickActions: {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
}[] = [
  {
    label: "Clients",
    description: "CRM & client dues",
    href: "/dashboard/clients",
    icon: Building2,
  },
  {
    label: "Invoices",
    description: "GST tax invoices",
    href: "/dashboard/invoices",
    icon: FileText,
  },
  {
    label: "Employees",
    description: "Add or manage staff",
    href: "/dashboard/employees",
    icon: Users,
  },
  {
    label: "Workshops",
    description: "Locations & geofence",
    href: "/dashboard/workshops",
    icon: MapPin,
  },
  {
    label: "Jobs",
    description: "Create & assign jobs",
    href: "/dashboard/jobs",
    icon: Briefcase,
  },
  {
    label: "Attendance",
    description: "Live & manual sessions",
    href: "/dashboard/attendance",
    icon: Clock,
  },
  {
    label: "History",
    description: "Employee time logs",
    href: "/dashboard/history",
    icon: History,
  },
  {
    label: "Requests",
    description: "Correction approvals",
    href: "/dashboard/requests",
    icon: FileEdit,
  },
  {
    label: "Salary",
    description: "Monthly payroll report",
    href: "/dashboard/salary",
    icon: DollarSign,
  },
  {
    label: "Advances",
    description: "Approve advance requests",
    href: "/dashboard/advances",
    icon: Wallet,
  },
];

export function DashboardQuickActions() {
  return (
    <section aria-labelledby="quick-actions-heading">
      <h2 id="quick-actions-heading" className="mb-4 text-lg font-semibold">
        Quick Actions
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group rounded-xl border border-border bg-card p-4 transition hover:border-primary/30 hover:bg-accent/50"
            >
              <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition group-hover:bg-primary/15">
                <Icon className="size-4" />
              </div>
              <p className="text-sm font-medium text-foreground">{action.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {action.description}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}