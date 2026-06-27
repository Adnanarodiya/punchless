"use client";

import { Modal } from "@punchless/ui/components/modal";

import { StaffPaymentManager } from "@/app/(dashboard)/dashboard/salary/payments/staff-payment-manager";
import type { BankWithBalance } from "@/lib/queries/bank.queries";
import type { EmployeeWithWorkshop } from "@/lib/queries/employee.queries";
import type { EmployeeSalaryPayable } from "@/lib/queries/salary.queries";
import type { StaffPaymentWithDetails } from "@/lib/queries/staff-payment.queries";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentMonth: string;
  employeeId: string;
  initialAmount?: number;
  initialPayable?: EmployeeSalaryPayable | null;
  payments: StaffPaymentWithDetails[];
  employees: EmployeeWithWorkshop[];
  banks: BankWithBalance[];
  returnPath: string;
};

export function PayStaffModal({
  open,
  onOpenChange,
  currentMonth,
  employeeId,
  initialAmount,
  initialPayable,
  payments,
  employees,
  banks,
  returnPath,
}: Props) {
  const employeeName =
    employees.find((e) => e.id === employeeId)?.full_name ??
    initialPayable?.employeeName ??
    "Employee";

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`Pay ${employeeName}`}
      className="sm:max-w-2xl"
    >
      <StaffPaymentManager
        payments={payments}
        employees={employees}
        banks={banks}
        initialEmployeeId={employeeId}
        initialMonth={currentMonth}
        initialOpenForm
        initialPayable={initialPayable}
        initialAmount={initialAmount}
        lockEmployee
        variant="modal"
        showHistory={false}
        returnPath={returnPath}
        onFormClose={() => onOpenChange(false)}
      />
    </Modal>
  );
}