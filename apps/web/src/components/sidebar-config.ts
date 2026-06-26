import type { LucideIcon } from "lucide-react";
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
  UserCircle,
  Building2,
  FileText,
  ShoppingCart,
  ArrowLeftRight,
  Landmark,
  Banknote,
  PiggyBank,
  BarChart3,
  ScrollText,
  Shield,
  GraduationCap,
} from "lucide-react";

export type NavItem = {
  label: string;
  href?: string;
  icon: LucideIcon;
  roles: string[];
  comingSoon?: boolean;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: ["owner", "admin"],
      },
      {
        label: "Learn",
        href: "/dashboard/learn",
        icon: GraduationCap,
        roles: ["owner", "admin"],
      },
    ],
  },
  {
    label: "People",
    items: [
      {
        label: "Employees",
        href: "/dashboard/employees",
        icon: Users,
        roles: ["owner", "admin"],
      },
      {
        label: "Posts",
        href: "/dashboard/posts",
        icon: UserCircle,
        roles: ["owner", "admin"],
      },
      {
        label: "Workshops",
        href: "/dashboard/workshops",
        icon: MapPin,
        roles: ["owner", "admin"],
      },
    ],
  },
  {
    label: "Operations",
    items: [
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
        label: "Jobs",
        href: "/dashboard/jobs",
        icon: Briefcase,
        roles: ["owner", "admin"],
      },
    ],
  },
  {
    label: "Commerce",
    items: [
      {
        label: "Clients",
        href: "/dashboard/clients",
        icon: Building2,
        roles: ["owner", "admin"],
      },
      {
        label: "Suppliers",
        href: "/dashboard/suppliers",
        icon: Users,
        roles: ["owner", "admin"],
      },
      {
        label: "Invoices",
        href: "/dashboard/invoices",
        icon: FileText,
        roles: ["owner", "admin"],
      },
      {
        label: "Purchases",
        href: "/dashboard/purchases",
        icon: ShoppingCart,
        roles: ["owner", "admin"],
      },
    ],
  },
  {
    label: "Finance",
    items: [
      {
        label: "Transactions",
        href: "/dashboard/transactions",
        icon: ArrowLeftRight,
        roles: ["owner", "admin"],
      },
      {
        label: "Banks",
        href: "/dashboard/banks",
        icon: Landmark,
        roles: ["owner", "admin"],
      },
    ],
  },
  {
    label: "Payroll",
    items: [
      {
        label: "Salary",
        href: "/dashboard/salary",
        icon: DollarSign,
        roles: ["owner", "admin"],
      },
      {
        label: "Payments",
        href: "/dashboard/salary/payments",
        icon: Banknote,
        roles: ["owner", "admin"],
      },
      {
        label: "Deposits",
        href: "/dashboard/salary/deposits",
        icon: PiggyBank,
        roles: ["owner", "admin"],
      },
      {
        label: "Advances",
        href: "/dashboard/advances",
        icon: Wallet,
        roles: ["owner", "admin"],
      },
    ],
  },
  {
    label: "Reports",
    items: [
      {
        label: "All Reports",
        href: "/dashboard/reports",
        icon: BarChart3,
        roles: ["owner", "admin"],
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        label: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
        roles: ["owner"],
      },
      {
        label: "Users",
        href: "/dashboard/settings/users",
        icon: Users,
        roles: ["owner"],
      },
      {
        label: "Audit Log",
        href: "/dashboard/audit-log",
        icon: Shield,
        roles: ["owner"],
      },
      {
        label: "Password",
        href: "/dashboard/settings/password",
        icon: Shield,
        roles: ["owner", "admin"],
      },
      {
        label: "Billing",
        href: "/dashboard/billing",
        icon: CreditCard,
        roles: ["owner"],
        comingSoon: true,
      },
    ],
  },
];

export function filterNavGroups(role: string): NavGroup[] {
  return navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((group) => group.items.length > 0);
}