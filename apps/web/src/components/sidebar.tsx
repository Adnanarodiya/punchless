"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Wallet,
  Settings,
  CreditCard,
  History,
  FileEdit,
} from "lucide-react";
import { cn } from "@punchless/ui/lib/utils";

interface SidebarProps {
  role: string;
  userName: string;
  companyName: string;
}

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["owner", "admin"],
  },
  {
    label: "Employees",
    href: "/dashboard/employees",
    icon: Users,
    roles: ["owner", "admin"],
  },
  {
    label: "Workshops",
    href: "/dashboard/workshops",
    icon: MapPin,
    roles: ["owner", "admin"],
  },
  {
    label: "Jobs",
    href: "/dashboard/jobs",
    icon: Briefcase,
    roles: ["owner", "admin"],
  },
  {
    label: "Attendance",
    href: "/dashboard/attendance",
    icon: Clock,
    roles: ["owner", "admin"],
  },
  {
    label: "History",
    href: "/dashboard/history",
    icon: History,
    roles: ["owner", "admin"],
  },
  {
    label: "Requests",
    href: "/dashboard/requests",
    icon: FileEdit,
    roles: ["owner", "admin"],
  },
  {
    label: "Salary",
    href: "/dashboard/salary",
    icon: DollarSign,
    roles: ["owner", "admin"],
  },
  {
    label: "Advances",
    href: "/dashboard/advances",
    icon: Wallet,
    roles: ["owner", "admin"],
  },
  {
    label: "Billing",
    href: "/dashboard/billing",
    icon: CreditCard,
    roles: ["owner"],
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    roles: ["owner"],
  },
];

export function Sidebar({ role, userName, companyName }: SidebarProps) {
  const pathname = usePathname();

  const filteredNav = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
        <Link href="/dashboard" className="text-xl font-bold text-sidebar-foreground">
          ⚡ Punchless
        </Link>
      </div>

      {/* Company info */}
      <div className="px-4 py-3 border-b border-sidebar-border">
        <p className="text-sm font-medium text-sidebar-foreground truncate">
          {companyName}
        </p>
        <p className="text-xs text-muted-foreground truncate">{userName}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredNav.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
