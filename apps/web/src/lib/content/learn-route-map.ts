/**
 * Maps dashboard URL paths to learn module IDs.
 * Longer paths are checked first so nested routes resolve correctly.
 */
const ROUTE_MAP: { path: string; moduleId: string; exact?: boolean }[] = [
  { path: "/dashboard/settings/users", moduleId: "users" },
  { path: "/dashboard/settings/password", moduleId: "password" },
  { path: "/dashboard/settings", moduleId: "settings" },
  { path: "/dashboard/salary/payments", moduleId: "payments" },
  { path: "/dashboard/salary/deposits", moduleId: "payments" },
  { path: "/dashboard/salary", moduleId: "salary" },
  { path: "/dashboard/reports", moduleId: "reports" },
  { path: "/dashboard/audit-log", moduleId: "audit-log" },
  { path: "/dashboard/banks", moduleId: "banks" },
  { path: "/dashboard/transactions", moduleId: "transactions" },
  { path: "/dashboard/advances", moduleId: "advances" },
  { path: "/dashboard/attendance", moduleId: "attendance" },
  { path: "/dashboard/history", moduleId: "history" },
  { path: "/dashboard/requests", moduleId: "requests" },
  { path: "/dashboard/workshops", moduleId: "workshops" },
  { path: "/dashboard/employees", moduleId: "employees" },
  { path: "/dashboard/posts", moduleId: "posts" },
  { path: "/dashboard/jobs", moduleId: "jobs" },
  { path: "/dashboard/customers", moduleId: "clients" },
  { path: "/dashboard/suppliers", moduleId: "suppliers" },
  { path: "/dashboard/invoices", moduleId: "invoices" },
  { path: "/dashboard/purchases", moduleId: "purchases" },
  { path: "/dashboard/billing", moduleId: "billing" },
  { path: "/dashboard", moduleId: "dashboard", exact: true },
];

const sortedRoutes = [...ROUTE_MAP].sort((a, b) => b.path.length - a.path.length);

export function resolveLearnModuleFromPath(pathname: string): string | null {
  if (!pathname.startsWith("/dashboard")) return null;
  if (pathname.startsWith("/dashboard/learn")) return null;
  if (pathname.endsWith("/print")) return null;

  for (const route of sortedRoutes) {
    if (route.exact) {
      if (pathname === route.path) return route.moduleId;
      continue;
    }
    if (pathname === route.path || pathname.startsWith(`${route.path}/`)) {
      return route.moduleId;
    }
  }

  return null;
}

export function learnGuideHref(moduleId: string): string {
  return `/dashboard/learn?module=${moduleId}`;
}