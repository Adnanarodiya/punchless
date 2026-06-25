import Link from "next/link";
import { Suspense } from "react";
import { Users, Clock, Briefcase, Wallet } from "lucide-react";

import { PageHeader } from "@punchless/ui/components/page-header";

import {
  getDashboardStats,
  getFinancialSummary,
  getFinancialYearsWithData,
  getRecentAttendance,
  getRecentJobs,
  getRevenueChart,
  getRevenueChartByMonth,
  getTodaysPayments,
  getTopPendingDues,
} from "@/lib/queries/dashboard.queries";
import { getDataLockStatus } from "@/lib/queries/settings.queries";
import { getStickyNotes } from "@/lib/queries/sticky-note.queries";
import {
  buildFinancialYearSelectOptions,
  getCurrentFinancialYearStartYear,
  resolveDashboardFinancialYear,
} from "@/lib/utils/financial-year";
import { DashboardDataLockControls } from "@/components/dashboard-data-lock-controls";

import { DashboardFinancialCards } from "./dashboard-financial-cards";
import { DashboardFySelector } from "./dashboard-fy-selector";
import { DashboardLiveClock } from "./dashboard-live-clock";
import { DashboardPendingDues } from "./dashboard-pending-dues";
import { DashboardQuickActions } from "./dashboard-quick-actions";
import { DashboardRecentTables } from "./dashboard-recent-tables";
import {
  DashboardRevenueChart,
  type ChartRange,
} from "./dashboard-revenue-chart";
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

  const [yearsWithData, stats, todaysPayments, pendingDues, revenueChart7d, revenueChart6m, recentAttendance, recentJobs, dataLock, stickyNotes] =
    await Promise.all([
    getFinancialYearsWithData(),
    getDashboardStats(),
    getTodaysPayments(),
    getTopPendingDues(5),
    getRevenueChart(7),
    getRevenueChartByMonth(6),
    getRecentAttendance(10),
    getRecentJobs(10),
    getDataLockStatus(),
    getStickyNotes(),
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
      label: "Currently Working",
      value: stats.activeSessionCount,
      icon: Clock,
      color: "text-success",
      bgColor: "bg-success/10",
      href: "/dashboard/attendance",
    },
    {
      label: "Active Jobs",
      value: stats.activeJobCount,
      icon: Briefcase,
      color: "text-warning",
      bgColor: "bg-warning/10",
      href: "/dashboard/jobs",
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
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Financial HQ + workshop operations — money, attendance, and jobs at a glance."
      >
        <div className="flex flex-col items-end gap-2">
          <DashboardLiveClock />
          <Suspense fallback={null}>
            <DashboardFySelector options={fyOptions} selectedFy={fyStartYear} />
          </Suspense>
          <DashboardDataLockControls hasDataLockPin={hasDataLockPin} />
        </div>
      </PageHeader>

      <DashboardFinancialCards
        summary={financial}
        hasDataLockPin={hasDataLockPin}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardTodaysPayments
          payments={todaysPayments}
          hasDataLockPin={hasDataLockPin}
        />
        <DashboardPendingDues dues={pendingDues} hasDataLockPin={hasDataLockPin} />
      </div>

      <Suspense fallback={null}>
        <DashboardRevenueChart
          points={revenueChart}
          chartRange={chartRange}
          hasDataLockPin={hasDataLockPin}
        />
      </Suspense>

      <DashboardStickyNotes notes={stickyNotes} />

      <section aria-labelledby="operations-heading">
        <h2 id="operations-heading" className="mb-4 text-lg font-semibold">
          Operations
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <DashboardQuickActions />

      <DashboardRecentTables
        recentAttendance={recentAttendance}
        recentJobs={recentJobs}
      />
    </div>
  );
}