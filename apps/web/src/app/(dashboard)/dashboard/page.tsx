import Link from "next/link";
import { Suspense } from "react";
import { Users, DollarSign, Wallet } from "lucide-react";

import {
  getDashboardStats,
  getFinancialSummary,
  getFinancialYearsWithData,
  getRevenueChart,
  getRevenueChartByMonth,
  getTodaysPayments,
  getTopPendingDues,
} from "@/lib/queries/dashboard.queries";
import { getCompanySettings, getDataLockStatus } from "@/lib/queries/settings.queries";
import { getStickyNotes } from "@/lib/queries/sticky-note.queries";
import {
  buildFinancialYearSelectOptions,
  getCurrentFinancialYearStartYear,
  resolveDashboardFinancialYear,
} from "@/lib/utils/financial-year";
import { DashboardFinancialCards } from "./dashboard-financial-cards";
import { DashboardFySelector } from "./dashboard-fy-selector";
import { DashboardMoneyHero } from "./dashboard-money-hero";
import { DashboardPendingDues } from "./dashboard-pending-dues";
import { DashboardPrimaryActions } from "./dashboard-primary-actions";
import { DashboardQuickActions } from "./dashboard-quick-actions";
import { DashboardShowMore } from "./dashboard-show-more";
import {
  DashboardRevenueChart,
  type ChartRange,
} from "./dashboard-revenue-chart";
import { SetupChecklist } from "@/components/setup-checklist";
import { getSetupChecklistStatus } from "@/lib/queries/setup-checklist.queries";
import { getBanks } from "@/lib/queries/bank.queries";
import { getActiveClients } from "@/lib/queries/client.queries";
import { getActiveSuppliers } from "@/lib/queries/supplier.queries";
import { DashboardHomeModals } from "@/components/dashboard-home-modals";
import { FyCalendarHint } from "@/components/fy-calendar-hint";
import { getTodaysBookSummary } from "@/lib/queries/cash-book.queries";
import { DashboardTodaysBook } from "./dashboard-todays-book";

import { DashboardStickyNotes } from "./dashboard-sticky-notes";
import { DashboardTodaysPayments } from "./dashboard-todays-payments";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ fy?: string; chart?: string }>;
}) {
  const params = await searchParams;
  const chartRange: ChartRange = params.chart === "6m" ? "6m" : "7d";
  const currentFy = getCurrentFinancialYearStartYear();

  const settings = await getCompanySettings();
  const isFullExperience = settings?.dashboard_experience === "full";

  const [
    yearsWithData,
    stats,
    todaysPayments,
    pendingDues,
    revenueChart7d,
    revenueChart6m,
    dataLock,
    stickyNotes,
    setupChecklist,
    clients,
    suppliers,
    banks,
    todaysBook,
  ] = await Promise.all([
    getFinancialYearsWithData(),
    getDashboardStats(),
    getTodaysPayments(),
    getTopPendingDues(5),
    getRevenueChart(7),
    getRevenueChartByMonth(6),
    getDataLockStatus(),
    isFullExperience ? getStickyNotes() : Promise.resolve([]),
    getSetupChecklistStatus(),
    getActiveClients(),
    getActiveSuppliers(),
    getBanks(),
    getTodaysBookSummary(new Date().toISOString().slice(0, 10)),
  ]);

  const fyStartYear = resolveDashboardFinancialYear(
    params.fy,
    yearsWithData,
    currentFy
  );
  const fyOptions = buildFinancialYearSelectOptions(
    yearsWithData,
    fyStartYear,
    currentFy,
    Boolean(params.fy)
  );
  const financial = await getFinancialSummary(fyStartYear);

  const revenueChart = chartRange === "6m" ? revenueChart6m : revenueChart7d;
  const hasDataLockPin = dataLock.hasPin;

  const operationCards = [
    {
      label: "Active Employees",
      value: stats.employeeCount,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
      href: "/dashboard/employees",
    },
    {
      label: "Fingerprint payroll",
      value: "Salary",
      icon: DollarSign,
      color: "text-success",
      bgColor: "bg-success/10",
      href: "/dashboard/salary",
    },
    {
      label: "Pending Advances",
      value: stats.pendingAdvanceCount,
      icon: Wallet,
      color: "text-state-travel",
      bgColor: "bg-state-travel/10",
      href: "/dashboard/advances",
    },
  ];

  return (
    <Suspense fallback={<div className="space-y-8 animate-pulse rounded-xl bg-muted/30 p-8" />}>
      <DashboardHomeModals
        clients={clients}
        suppliers={suppliers}
        banks={banks}
        invoicePrefix={settings?.sales_invoice_prefix ?? "ISHABA"}
      >
        <div className="space-y-8">
      <DashboardMoneyHero summary={financial} hasDataLockPin={hasDataLockPin} />

      <DashboardPrimaryActions />

      <DashboardTodaysBook book={todaysBook} />

      <DashboardPendingDues dues={pendingDues} />

      <DashboardShowMore>
        <SetupChecklist status={setupChecklist} />

        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Detailed financial overview for {financial.periodLabel}
          </p>
          <Suspense fallback={null}>
            <DashboardFySelector options={fyOptions} selectedFy={fyStartYear} />
          </Suspense>
        </div>

        <FyCalendarHint />

        <DashboardFinancialCards summary={financial} />

        <DashboardQuickActions />

        <div className="grid grid-cols-1 gap-6">
          <DashboardTodaysPayments payments={todaysPayments} />
        </div>

        <Suspense fallback={null}>
          <DashboardRevenueChart
            points={revenueChart}
            chartRange={chartRange}
          />
        </Suspense>

        {isFullExperience ? <DashboardStickyNotes notes={stickyNotes} /> : null}

        <section aria-labelledby="operations-heading">
          <h2 id="operations-heading" className="mb-4 text-lg font-semibold">
            Operations
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {operationCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Link
                  key={stat.label}
                  href={stat.href}
                  className="rounded-xl border border-border bg-card p-5 transition hover:border-primary/30 hover:bg-accent/30"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <div
                      className={`rounded-lg p-2 ${stat.bgColor} ${stat.color}`}
                    >
                      <Icon className="size-4" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </Link>
              );
            })}
          </div>
        </section>
      </DashboardShowMore>
        </div>
      </DashboardHomeModals>
    </Suspense>
  );
}