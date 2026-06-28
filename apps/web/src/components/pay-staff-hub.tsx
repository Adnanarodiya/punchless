"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarCheck, History } from "lucide-react";

import { Button } from "@punchless/ui/components/button";
import { cn } from "@punchless/ui/lib/utils";
import { FingerprintSalarySection } from "@/components/fingerprint-salary-section";
import { PayrollFlowPanel } from "@/components/payroll-flow-panel";
import { DashboardPageHeader } from "@/components/dashboard-page-header";
import { PayStaffModal } from "@/components/pay-staff-modal";
import { StaffPaymentManager } from "@/app/(dashboard)/dashboard/salary/payments/staff-payment-manager";
import type { BankWithBalance } from "@/lib/queries/bank.queries";
import type { EmployeeWithWorkshop } from "@/lib/queries/employee.queries";
import type { EmployeeSalaryPayable } from "@/lib/queries/salary.queries";
import type { StaffPaymentWithDetails } from "@/lib/queries/staff-payment.queries";
import type { AttendanceImportSummary } from "@/lib/queries/attendance-import.queries";
import type { FingerprintSalaryReport } from "@/lib/utils/fingerprint-salary-report";
import { PageFirstVisitTip } from "@/components/page-first-visit-tip";
import { fetchEmployeeSalaryPayable } from "@/lib/actions/staff-payment.actions";

type Tab = "this-month" | "history";

type Props = {
  currentMonth: string;
  fingerprintReport: FingerprintSalaryReport | null;
  savedMonths: AttendanceImportSummary[];
  employeesForMapping: Array<{ id: string; fullName: string }>;
  payments: StaffPaymentWithDetails[];
  employees: EmployeeWithWorkshop[];
  banks: BankWithBalance[];
  initialEmployeeId?: string;
  initialOpenPay?: boolean;
  initialAmount?: number;
  initialPayable?: EmployeeSalaryPayable | null;
  initialTab?: Tab;
};

function buildSalaryUrl(
  month: string,
  options?: { tab?: Tab; employee?: string }
) {
  const params = new URLSearchParams();
  params.set("month", month);
  if (options?.tab === "history") params.set("tab", "history");
  if (options?.employee) params.set("employee", options.employee);
  return `/dashboard/salary?${params.toString()}`;
}

export function PayStaffHub({
  currentMonth,
  fingerprintReport,
  savedMonths,
  employeesForMapping,
  payments,
  employees,
  banks,
  initialEmployeeId = "",
  initialOpenPay = false,
  initialAmount,
  initialPayable = null,
  initialTab = "this-month",
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [payModalOpen, setPayModalOpen] = useState(
    initialOpenPay && !!initialEmployeeId
  );
  const [payEmployeeId, setPayEmployeeId] = useState(initialEmployeeId);
  const [payAmount, setPayAmount] = useState(initialAmount);
  const [payPayable, setPayPayable] = useState<EmployeeSalaryPayable | null>(
    initialPayable
  );

  useEffect(() => {
    if (initialOpenPay && initialEmployeeId) {
      setPayEmployeeId(initialEmployeeId);
      setPayAmount(initialAmount);
      setPayPayable(initialPayable);
      setPayModalOpen(true);
    }
  }, [initialOpenPay, initialEmployeeId, initialAmount, initialPayable]);

  const openPayModal = useCallback(
    async (employeeId: string, amount: number) => {
      setPayEmployeeId(employeeId);
      setPayAmount(amount > 0 ? Math.round(amount) : undefined);
      const result = await fetchEmployeeSalaryPayable(employeeId, currentMonth);
      setPayPayable(result.success ? result.data : null);
      setPayModalOpen(true);
    },
    [currentMonth]
  );

  const closePayModal = useCallback(
    (open: boolean) => {
      setPayModalOpen(open);
      if (!open) {
        router.replace(buildSalaryUrl(currentMonth));
      }
    },
    [currentMonth, router]
  );

  const switchTab = useCallback(
    (next: Tab) => {
      setTab(next);
      const employee = searchParams.get("employee") ?? undefined;
      router.replace(
        buildSalaryUrl(currentMonth, {
          tab: next === "history" ? "history" : undefined,
          employee: next === "history" ? employee : undefined,
        })
      );
    },
    [currentMonth, router, searchParams]
  );

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Pay Staff"
        description="Upload attendance, see what each employee earned, and pay — all in one place."
      />

      <PageFirstVisitTip pageId="salary" />

      <div className="inline-flex w-full max-w-md rounded-lg border border-input bg-muted/40 p-1 sm:w-auto">
        <Button
          type="button"
          variant="ghost"
          onClick={() => switchTab("this-month")}
          className={cn(
            "h-9 flex-1 gap-2 rounded-md px-4 text-sm font-medium sm:flex-none",
            tab === "this-month"
              ? "bg-background text-foreground shadow-sm hover:bg-background"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <CalendarCheck className="size-4" />
          This month
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => switchTab("history")}
          className={cn(
            "h-9 flex-1 gap-2 rounded-md px-4 text-sm font-medium sm:flex-none",
            tab === "history"
              ? "bg-background text-foreground shadow-sm hover:bg-background"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <History className="size-4" />
          History
        </Button>
      </div>

      {tab === "this-month" ? (
        <>
          <PayrollFlowPanel unifiedHub />
          <FingerprintSalarySection
            currentMonth={currentMonth}
            report={fingerprintReport}
            savedMonths={savedMonths}
            employeesForMapping={employeesForMapping}
            unifiedPayStaff
            onPayEmployee={(employeeId, amount) => {
              void openPayModal(employeeId, amount);
            }}
          />
          <p className="text-xs text-muted-foreground">
            Tap <strong>Pay</strong> on any row to open the payment form. After you confirm, a
            printable salary slip opens automatically.
          </p>
        </>
      ) : (
        <StaffPaymentManager
          payments={payments}
          employees={employees}
          banks={banks}
          initialEmployeeId={initialEmployeeId}
          initialMonth={currentMonth}
          variant="hub-history"
          returnPath={buildSalaryUrl(currentMonth, { tab: "history" })}
          showAllLinkHref={buildSalaryUrl(currentMonth, { tab: "history" })}
        />
      )}

      {payEmployeeId ? (
        <PayStaffModal
          open={payModalOpen}
          onOpenChange={closePayModal}
          currentMonth={currentMonth}
          employeeId={payEmployeeId}
          initialAmount={payAmount}
          initialPayable={payPayable}
          payments={payments}
          employees={employees}
          banks={banks}
          returnPath={buildSalaryUrl(currentMonth)}
        />
      ) : null}
    </div>
  );
}

export { buildSalaryUrl };