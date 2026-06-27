import { getPendingAdvanceCount } from "@/lib/queries/advance.queries";
import { getFingerprintSalaryReport } from "@/lib/queries/attendance-import.queries";

export type PayrollChecklistStep = {
  id: string;
  label: string;
  href: string;
  done: boolean;
};

export type PayrollMonthChecklistData = {
  salaryMonth: string;
  monthLabel: string;
  steps: PayrollChecklistStep[];
  completedCount: number;
  totalCount: number;
  allDone: boolean;
};

export function isPayrollChecklistWindow(date = new Date()): boolean {
  const day = date.getDate();
  return day >= 25 || day <= 5;
}

function currentMonthStr(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(monthStr: string) {
  const [year, month] = monthStr.split("-").map(Number);
  const label = new Date(year, (month ?? 1) - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
  return label;
}

export async function getPayrollMonthChecklistStatus(
  salaryMonth = currentMonthStr()
): Promise<PayrollMonthChecklistData | null> {
  if (!isPayrollChecklistWindow()) return null;

  const [report, pendingAdvances] = await Promise.all([
    getFingerprintSalaryReport(salaryMonth),
    getPendingAdvanceCount(),
  ]);

  const attendanceUploaded = !!report?.uploadedAt;
  const advancesCleared = pendingAdvances === 0;

  const unpaidLines =
    report?.lines.filter((line) => line.isMatched && line.suggestedPay > 0) ?? [];
  const salaryReviewed =
    attendanceUploaded && (report?.unmatchedCount ?? 0) === 0;

  const staffPaid = attendanceUploaded && unpaidLines.length === 0;

  const steps: PayrollChecklistStep[] = [
    {
      id: "attendance",
      label: "Upload attendance",
      href: `/dashboard/salary?month=${salaryMonth}`,
      done: attendanceUploaded,
    },
    {
      id: "advances",
      label: "Clear advance requests",
      href: "/dashboard/advances",
      done: advancesCleared,
    },
    {
      id: "review",
      label: "Review salary report",
      href: `/dashboard/salary?month=${salaryMonth}#salary-report`,
      done: salaryReviewed,
    },
    {
      id: "pay",
      label: "Pay staff",
      href: `/dashboard/salary?month=${salaryMonth}`,
      done: staffPaid,
    },
  ];

  const completedCount = steps.filter((step) => step.done).length;

  return {
    salaryMonth,
    monthLabel: formatMonthLabel(salaryMonth),
    steps,
    completedCount,
    totalCount: steps.length,
    allDone: completedCount === steps.length,
  };
}