import type { LucideIcon } from "lucide-react";
import type { DashboardExperience } from "@punchless/types";
import {
  LayoutDashboard,
  Users,
  Wallet,
  Settings,
  CreditCard,
  UserCircle,
  Building2,
  ShoppingCart,
  Landmark,
  Banknote,
  PiggyBank,
  BarChart3,
  Shield,
  ScrollText,
  ClipboardList,
} from "lucide-react";

export type NavTier = "primary" | "advanced" | "full-only";

export type NavItem = {
  label: string;
  simpleLabel?: string;
  href?: string;
  icon: LucideIcon;
  roles: string[];
  comingSoon?: boolean;
  /** Where this item appears in Simple mode. Defaults to advanced when omitted. */
  simpleTier?: NavTier;
  /** Group label override in Simple mode (e.g. Staff, Commerce). */
  simpleGroup?: string;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const MORE_TOOLS_GROUP_LABEL = "More tools";

export const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        simpleLabel: "Home",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: ["owner", "admin"],
        simpleTier: "primary",
        simpleGroup: "Overview",
      },
      {
        label: "Daily report",
        simpleLabel: "Daily report",
        href: "/dashboard/daily-report",
        icon: ScrollText,
        roles: ["owner", "admin"],
        simpleTier: "primary",
        simpleGroup: "Overview",
      },
      {
        label: "Cash book",
        href: "/dashboard/cash-book",
        icon: Wallet,
        roles: ["owner", "admin"],
        simpleTier: "primary",
        simpleGroup: "Overview",
      },
      {
        label: "Bank book",
        href: "/dashboard/bank-book",
        icon: Landmark,
        roles: ["owner", "admin"],
        simpleTier: "primary",
        simpleGroup: "Overview",
      },
      {
        label: "Today's entry",
        href: "/dashboard/todays-entry",
        icon: ClipboardList,
        roles: ["owner", "admin"],
        simpleTier: "advanced",
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
        simpleTier: "primary",
        simpleGroup: "Staff",
      },
      {
        label: "Job titles",
        href: "/dashboard/posts",
        icon: UserCircle,
        roles: ["owner", "admin"],
        simpleTier: "full-only",
      },
    ],
  },
  {
    label: "Commerce",
    items: [
      {
        label: "Customers",
        simpleLabel: "Customers",
        href: "/dashboard/customers",
        icon: Building2,
        roles: ["owner", "admin"],
        simpleTier: "primary",
        simpleGroup: "Commerce",
      },
      {
        label: "Suppliers",
        href: "/dashboard/suppliers",
        icon: Users,
        roles: ["owner", "admin"],
        simpleTier: "primary",
        simpleGroup: "Commerce",
      },
      {
        label: "Supplier bills",
        href: "/dashboard/purchases",
        icon: ShoppingCart,
        roles: ["owner", "admin"],
        simpleTier: "primary",
        simpleGroup: "Commerce",
      },
    ],
  },
  {
    label: "Finance",
    items: [
      {
        label: "Banks",
        href: "/dashboard/banks",
        icon: Landmark,
        roles: ["owner", "admin"],
        simpleTier: "advanced",
      },
    ],
  },
  {
    label: "Payroll",
    items: [
      {
        label: "Staff salary",
        simpleLabel: "Pay Staff",
        href: "/dashboard/salary",
        icon: Banknote,
        roles: ["owner", "admin"],
        simpleTier: "primary",
        simpleGroup: "Staff",
      },
      {
        label: "Pay staff",
        href: "/dashboard/salary/payments",
        icon: Banknote,
        roles: ["owner", "admin"],
        simpleTier: "full-only",
      },
      {
        label: "Salary balance",
        href: "/dashboard/salary/deposits",
        icon: PiggyBank,
        roles: ["owner", "admin"],
        simpleTier: "advanced",
      },
      {
        label: "Advances",
        href: "/dashboard/advances",
        icon: Wallet,
        roles: ["owner", "admin"],
        simpleTier: "advanced",
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
        simpleTier: "advanced",
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
        simpleTier: "primary",
        simpleGroup: "Account",
      },
      {
        label: "Users",
        href: "/dashboard/settings/users",
        icon: Users,
        roles: ["owner"],
        simpleTier: "advanced",
      },
      {
        label: "Audit Log",
        href: "/dashboard/audit-log",
        icon: Shield,
        roles: ["owner"],
        simpleTier: "full-only",
      },
      {
        label: "Password",
        href: "/dashboard/settings/password",
        icon: Shield,
        roles: ["owner", "admin"],
        simpleTier: "advanced",
      },
      {
        label: "Billing",
        href: "/dashboard/billing",
        icon: CreditCard,
        roles: ["owner"],
        comingSoon: true,
        simpleTier: "full-only",
      },
    ],
  },
];

function itemMatchesRole(item: NavItem, role: string): boolean {
  return item.roles.includes(role);
}

function resolveSimpleTier(item: NavItem): NavTier {
  return item.simpleTier ?? "advanced";
}

function displayLabel(item: NavItem, experience: DashboardExperience): string {
  if (experience === "simple" && item.simpleLabel) {
    return item.simpleLabel;
  }
  return item.label;
}

function buildSimpleNavGroups(role: string): NavGroup[] {
  const primaryByGroup = new Map<string, NavItem[]>();
  const advancedItems: NavItem[] = [];

  for (const group of navGroups) {
    for (const item of group.items) {
      if (!itemMatchesRole(item, role)) continue;

      const tier = resolveSimpleTier(item);
      if (tier === "full-only") continue;

      if (tier === "primary") {
        const groupLabel = item.simpleGroup ?? group.label;
        const bucket = primaryByGroup.get(groupLabel) ?? [];
        bucket.push(item);
        primaryByGroup.set(groupLabel, bucket);
      } else {
        advancedItems.push(item);
      }
    }
  }

  const primaryOrder = ["Overview", "Commerce", "Staff", "Account"];
  const primaryGroups: NavGroup[] = [];

  for (const label of primaryOrder) {
    const items = primaryByGroup.get(label);
    if (items?.length) {
      primaryGroups.push({ label, items });
    }
  }

  for (const [label, items] of primaryByGroup) {
    if (!primaryOrder.includes(label)) {
      primaryGroups.push({ label, items });
    }
  }

  if (advancedItems.length > 0) {
    primaryGroups.push({ label: MORE_TOOLS_GROUP_LABEL, items: advancedItems });
  }

  return primaryGroups;
}

export function filterNavGroups(
  role: string,
  experience: DashboardExperience = "full"
): NavGroup[] {
  if (experience === "simple") {
    return buildSimpleNavGroups(role);
  }

  return navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => itemMatchesRole(item, role)),
    }))
    .filter((group) => group.items.length > 0);
}

export function getNavItemLabel(
  item: NavItem,
  experience: DashboardExperience
): string {
  return displayLabel(item, experience);
}

export function isNavItemActive(pathname: string, href: string) {
  return (
    pathname === href ||
    (href !== "/dashboard" && pathname.startsWith(href))
  );
}

export function findActiveGroupLabel(
  groups: NavGroup[],
  pathname: string
): string | null {
  for (const group of groups) {
    for (const item of group.items) {
      if (item.href && isNavItemActive(pathname, item.href)) {
        return group.label;
      }
    }
  }
  return null;
}