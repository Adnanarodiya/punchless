import type { FingerprintSalaryLine } from "@/lib/utils/fingerprint-salary-report";
import type { StaffPaymentSlipSnapshot } from "@/lib/types/staff-payment-slip";
import { formatCurrency, formatMonthYear } from "@/lib/utils/formatting";

export function buildSlipSnapshotFromFingerprintLine(
  line: FingerprintSalaryLine,
  args: {
    salaryMonth: string;
    amountPaid: number;
    paymentDate: string;
    paymentMode: "cash" | "bank" | null;
    remark: string | null;
    otRateMultiplier: number;
    eligibleDays: number;
  }
): StaffPaymentSlipSnapshot {
  return {
    employeeName: line.employeeName,
    designation: line.designation,
    salaryMonth: args.salaryMonth,
    monthlySalary: line.monthlySalary,
    workingDays: line.workingDays,
    absentDays: line.weekdayAbsents,
    sundaysExcluded: line.sundaysExcluded,
    eligibleDays: args.eligibleDays,
    otHours: line.otHours,
    otRateMultiplier: args.otRateMultiplier,
    earnedSalary: line.earnedSalary,
    otPay: line.otPay,
    totalSalary: line.totalSalary,
    advanceDeduction: line.advanceDeduction,
    alreadyPaidBefore: line.alreadyPaid,
    netPayment: line.netPayment,
    amountPaid: args.amountPaid,
    paymentDate: args.paymentDate,
    paymentMode: args.paymentMode,
    remark: args.remark,
  };
}

export function normalizeSlipSnapshot(
  raw: StaffPaymentSlipSnapshot
): StaffPaymentSlipSnapshot {
  return {
    ...raw,
    absentDays: raw.absentDays ?? 0,
    sundaysExcluded: raw.sundaysExcluded ?? 0,
    alreadyPaidBefore: raw.alreadyPaidBefore ?? 0,
  };
}

/** Plain-language proof text for employee disputes. */
export function buildSalarySlipExplanation(snapshot: StaffPaymentSlipSnapshot): string {
  const month = formatMonthYear(snapshot.salaryMonth);
  const parts: string[] = [];

  parts.push(
    `Fixed monthly salary ${formatCurrency(snapshot.monthlySalary)} for ${month}.`
  );

  parts.push(
    `Attendance: ${snapshot.workingDays} working day(s)${snapshot.absentDays > 0 ? `, ${snapshot.absentDays} absent day(s)` : ""}${snapshot.sundaysExcluded > 0 ? `, ${snapshot.sundaysExcluded} Sunday(s) excluded` : ""} (eligible ${snapshot.eligibleDays} days).`
  );

  parts.push(
    `Earned salary ${formatCurrency(snapshot.earnedSalary)}` +
      (snapshot.otPay > 0
        ? ` + OT ${formatCurrency(snapshot.otPay)} (${snapshot.otHours.toFixed(2)} hrs)`
        : "") +
      ` = total ${formatCurrency(snapshot.totalSalary)}.`
  );

  if (snapshot.advanceDeduction > 0) {
    parts.push(`Advance (Upad) deducted: ${formatCurrency(snapshot.advanceDeduction)}.`);
  }

  if (snapshot.alreadyPaidBefore > 0) {
    parts.push(`Already paid earlier this month: ${formatCurrency(snapshot.alreadyPaidBefore)}.`);
  }

  parts.push(
    `Net payable was ${formatCurrency(snapshot.netPayment)}. Paid on ${snapshot.paymentDate}: ${formatCurrency(snapshot.amountPaid)}.`
  );

  return parts.join(" ");
}

export function slipPrintTitle(snapshot: StaffPaymentSlipSnapshot): string {
  const safeName = snapshot.employeeName.replace(/[^\w\s-]/g, "").trim();
  const [year, month] = snapshot.salaryMonth.split("-");
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const monthLabel = monthNames[Number(month) - 1] ?? month;
  return `SalarySlip_${safeName}_${monthLabel}_${year}`;
}