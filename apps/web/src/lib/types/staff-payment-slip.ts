/** Frozen at payment time — printable salary proof for owner and employee disputes. */
export type StaffPaymentSlipSnapshot = {
  employeeName: string;
  designation: string | null;
  salaryMonth: string;
  monthlySalary: number;
  /** Days worked (present) from fingerprint */
  workingDays: number;
  /** Weekday absent days in the month */
  absentDays: number;
  /** Sundays excluded from eligible count */
  sundaysExcluded: number;
  eligibleDays: number;
  otHours: number;
  otRateMultiplier: number;
  earnedSalary: number;
  otPay: number;
  totalSalary: number;
  advanceDeduction: number;
  /** Salary already paid for this month before this payment */
  alreadyPaidBefore: number;
  netPayment: number;
  amountPaid: number;
  paymentDate: string;
  paymentMode: "cash" | "bank" | null;
  remark: string | null;
};