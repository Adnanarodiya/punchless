"use server";

import { revalidatePath } from "next/cache";
import { protectedAction } from "@/lib/server/protected-action";
import {
  getEmployeeSalaryPayable,
  type EmployeeSalaryPayable,
} from "@/lib/queries/salary.queries";
import {
  createSalaryDepositSchema,
  createStaffPaymentSchema,
} from "@/lib/validations/staff-payment.schema";

export async function fetchEmployeeSalaryPayable(
  employeeId: string,
  monthStr: string
): Promise<
  | { success: true; data: EmployeeSalaryPayable }
  | { success: false; error: string }
> {
  if (!employeeId?.trim()) {
    return { success: false, error: "Select an employee" };
  }
  if (!monthStr?.trim()) {
    return { success: false, error: "Select a salary month" };
  }

  const data = await getEmployeeSalaryPayable(employeeId, monthStr);
  if (!data) {
    return { success: false, error: "Employee not found" };
  }

  return { success: true, data };
}

function revalidateStaffFinancePages(employeeId?: string, bankId?: string | null) {
  revalidatePath("/dashboard/salary/payments");
  revalidatePath("/dashboard/salary/deposits");
  revalidatePath("/dashboard/salary");
  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/employees");
  if (employeeId) {
    revalidatePath(`/dashboard/employees/${employeeId}/statement`);
  }
  if (bankId) {
    revalidatePath(`/dashboard/banks/${bankId}/statement`);
    revalidatePath("/dashboard/banks");
  }
}

async function writeStaffExpenseLedgers(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  params: {
    companyId: string;
    userId: string;
    amount: number;
    paymentMode: "cash" | "bank";
    bankId: string | null;
    paymentDate: string;
    particular: string;
    remark: string;
    referenceId: string;
  }
) {
  const { error: transactionError, data: transaction } = await supabase
    .from("transactions")
    .insert({
      company_id: params.companyId,
      particular: params.particular,
      amount: params.amount,
      transaction_type: "expense",
      payment_mode: params.paymentMode,
      bank_id: params.bankId,
      transaction_date: params.paymentDate,
      remark: params.remark,
      created_by: params.userId,
    } as never)
    .select("id")
    .single();

  if (transactionError || !transaction) {
    return { success: false as const, error: transactionError?.message || "Failed to record expense" };
  }

  const ledgerRemark = params.remark || params.particular;

  const { error: expenseLedgerError } = await supabase.from("ledger_entries").insert({
    company_id: params.companyId,
    entity_type: "expense",
    entity_id: transaction.id,
    entry_type: "debit",
    amount: params.amount,
    payment_mode: params.paymentMode,
    bank_id: params.bankId,
    reference_type: "expense",
    reference_id: transaction.id,
    remark: ledgerRemark,
    entry_date: params.paymentDate,
    created_by: params.userId,
  } as never);

  if (expenseLedgerError) {
    return { success: false as const, error: expenseLedgerError.message };
  }

  if (params.paymentMode === "bank" && params.bankId) {
    const { error: bankLedgerError } = await supabase.from("ledger_entries").insert({
      company_id: params.companyId,
      entity_type: "bank",
      entity_id: params.bankId,
      entry_type: "debit",
      amount: params.amount,
      payment_mode: "bank",
      bank_id: params.bankId,
      reference_type: "expense",
      reference_id: transaction.id,
      remark: ledgerRemark,
      entry_date: params.paymentDate,
      created_by: params.userId,
    } as never);

    if (bankLedgerError) {
      return { success: false as const, error: bankLedgerError.message };
    }
  }

  return { success: true as const };
}

export const createStaffPayment = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "create_staff_payment", entityType: "staff-payment" },
})(async (formData, { supabase, me }) => {
  const parsed = createStaffPaymentSchema.safeParse({
    employeeId: formData.get("employeeId"),
    paymentType: formData.get("paymentType"),
    amount: formData.get("amount"),
    paymentMode: formData.get("paymentMode") || undefined,
    bankId: formData.get("bankId"),
    paymentDate: formData.get("paymentDate"),
    remark: formData.get("remark"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const data = parsed.data;
  const bankId = data.bankId?.trim() ? data.bankId : null;
  const paymentMode = data.paymentMode ?? null;

  const { data: employee } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", data.employeeId)
    .single();

  const employeeName = (employee as { full_name: string } | null)?.full_name ?? "Employee";

  const { data: payment, error: paymentError } = await supabase
    .from("staff_payments")
    .insert({
      company_id: me.company_id,
      employee_id: data.employeeId,
      payment_type: data.paymentType,
      amount: data.amount,
      payment_mode: paymentMode,
      bank_id: bankId,
      payment_date: data.paymentDate,
      remark: data.remark || null,
      created_by: me.id,
    } as never)
    .select("id")
    .single();

  if (paymentError || !payment) {
    return {
      success: false,
      error: paymentError?.message || "Failed to record staff payment",
    };
  }

  const typeLabel =
    data.paymentType === "advance"
      ? "Advance"
      : data.paymentType === "salary_paid"
        ? "Salary paid"
        : "Deduction";

  const { error: staffLedgerError } = await supabase.from("ledger_entries").insert({
    company_id: me.company_id,
    entity_type: "staff",
    entity_id: data.employeeId,
    entry_type: "debit",
    amount: data.amount,
    payment_mode: paymentMode,
    bank_id: bankId,
    reference_type: "staff_payment",
    reference_id: payment.id,
    remark: data.remark || `${typeLabel} — ${employeeName}`,
    entry_date: data.paymentDate,
    created_by: me.id,
  } as never);

  if (staffLedgerError) {
    return { success: false, error: staffLedgerError.message };
  }

  if (data.paymentType !== "deduction" && paymentMode) {
    const expenseResult = await writeStaffExpenseLedgers(supabase, {
      companyId: me.company_id,
      userId: me.id,
      amount: data.amount,
      paymentMode,
      bankId,
      paymentDate: data.paymentDate,
      particular: `Staff ${typeLabel.toLowerCase()} — ${employeeName}`,
      remark: data.remark || `${typeLabel} to ${employeeName}`,
      referenceId: payment.id,
    });

    if (!expenseResult.success) {
      return { success: false, error: expenseResult.error };
    }
  }

  revalidateStaffFinancePages(data.employeeId, bankId);
  return { success: true };
});

export const createSalaryDeposit = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "create_salary_deposit", entityType: "staff-payment" },
})(async (formData, { supabase, me }) => {
  const parsed = createSalaryDepositSchema.safeParse({
    employeeId: formData.get("employeeId"),
    amount: formData.get("amount"),
    depositDate: formData.get("depositDate"),
    remark: formData.get("remark"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const data = parsed.data;

  const { data: employee } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", data.employeeId)
    .single();

  const employeeName = (employee as { full_name: string } | null)?.full_name ?? "Employee";

  const { data: deposit, error: depositError } = await supabase
    .from("salary_deposits")
    .insert({
      company_id: me.company_id,
      employee_id: data.employeeId,
      amount: data.amount,
      deposit_date: data.depositDate,
      remark: data.remark || null,
      created_by: me.id,
    } as never)
    .select("id")
    .single();

  if (depositError || !deposit) {
    return {
      success: false,
      error: depositError?.message || "Failed to record salary deposit",
    };
  }

  const { error: ledgerError } = await supabase.from("ledger_entries").insert({
    company_id: me.company_id,
    entity_type: "staff",
    entity_id: data.employeeId,
    entry_type: "credit",
    amount: data.amount,
    reference_type: "salary_deposit",
    reference_id: deposit.id,
    remark: data.remark || `Salary deposit — ${employeeName}`,
    entry_date: data.depositDate,
    created_by: me.id,
  } as never);

  if (ledgerError) {
    return { success: false, error: ledgerError.message };
  }

  revalidateStaffFinancePages(data.employeeId);
  return { success: true };
});

export const deleteStaffPayment = protectedAction<FormData>({
  roles: ["owner"],
  audit: { action: "delete_staff_payment", entityType: "staff-payment" },
})(async (formData, { supabase }) => {
  const paymentId = String(formData.get("paymentId") || "");
  if (!paymentId) return { success: false, error: "Payment ID required" };

  const { data: existing } = await supabase
    .from("staff_payments")
    .select("employee_id, bank_id")
    .eq("id", paymentId)
    .single();

  const { error } = await supabase
    .from("staff_payments")
    .delete()
    .eq("id", paymentId);

  if (error) return { success: false, error: error.message };

  await supabase
    .from("ledger_entries")
    .delete()
    .eq("reference_type", "staff_payment")
    .eq("reference_id", paymentId);

  const row = existing as { employee_id: string; bank_id: string | null } | null;
  revalidateStaffFinancePages(row?.employee_id, row?.bank_id ?? null);
  return { success: true };
});

export const deleteSalaryDeposit = protectedAction<FormData>({
  roles: ["owner"],
  audit: { action: "delete_salary_deposit", entityType: "staff-payment" },
})(async (formData, { supabase }) => {
  const depositId = String(formData.get("depositId") || "");
  if (!depositId) return { success: false, error: "Deposit ID required" };

  const { data: existing } = await supabase
    .from("salary_deposits")
    .select("employee_id")
    .eq("id", depositId)
    .single();

  const { error } = await supabase
    .from("salary_deposits")
    .delete()
    .eq("id", depositId);

  if (error) return { success: false, error: error.message };

  await supabase
    .from("ledger_entries")
    .delete()
    .eq("reference_type", "salary_deposit")
    .eq("reference_id", depositId);

  const row = existing as { employee_id: string } | null;
  revalidateStaffFinancePages(row?.employee_id);
  return { success: true };
});