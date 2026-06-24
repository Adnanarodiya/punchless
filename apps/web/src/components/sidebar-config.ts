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
        icon: UserCircle,
        roles: ["owner", "admin"],
        comingSoon: true,
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
        icon: ArrowLeftRight,
        roles: ["owner", "admin"],
        comingSoon: true,
      },
      {
        label: "Banks",
        icon: Landmark,
        roles: ["owner", "admin"],
        comingSoon: true,
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
        icon: Banknote,
        roles: ["owner", "admin"],
        comingSoon: true,
      },
      {
        label: "Deposits",
        icon: PiggyBank,
        roles: ["owner", "admin"],
        comingSoon: true,
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
        label: "Daily",
        icon: BarChart3,
        roles: ["owner", "admin"],
        comingSoon: true,
      },
      {
        label: "Monthly",
        icon: BarChart3,
        roles: ["owner", "admin"],
        comingSoon: true,
      },
      {
        label: "Rojmel",
        icon: ScrollText,
        roles: ["owner", "admin"],
        comingSoon: true,
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
        icon: Users,
        roles: ["owner"],
        comingSoon: true,
      },
      {
        label: "Audit Log",
        icon: Shield,
        roles: ["owner"],
        comingSoon: true,
      },
      {
        label: "Billing",
        href: "/dashboard/billing",
        icon: CreditCard,
        roles: ["owner"],
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