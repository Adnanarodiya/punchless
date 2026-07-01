import type { StatementTableLabels } from "@punchless/ui/components/statement-table";

import type { BalanceMeta, StatementResult } from "@/lib/utils/statement";

export function parseSystemLedgerParticular(
  remark: string | null,
  kind: "income" | "expense"
): string {
  if (!remark?.trim()) return "—";

  let text = remark.trim();
  const prefix =
    kind === "income" ? /^INCOME\s*[-–]\s*/i : /^EXPENSE\s*[-–]\s*/i;
  text = text.replace(prefix, "");
  text = text.replace(/\s*—\s*received\s*\([^)]*\)\s*$/i, "");

  return text.trim() || "—";
}

export function formatSystemLedgerBalanceMeta(
  balance: BalanceMeta,
  kind: "income" | "expense"
): BalanceMeta {
  return {
    amount: balance.amount,
    status: kind === "expense" ? "due" : balance.status,
    label: "",
  };
}

export function transformSystemIncomeStatement(
  statement: StatementResult
): StatementResult {
  return {
    ...statement,
    opening: formatSystemLedgerBalanceMeta(statement.opening, "income"),
    closing: formatSystemLedgerBalanceMeta(statement.closing, "income"),
    lines: statement.lines.map((line) => ({
      ...line,
      remark: parseSystemLedgerParticular(line.remark, "income"),
      balance_meta: formatSystemLedgerBalanceMeta(line.balance_meta, "income"),
      invoice_number: null,
      vehicle_number: null,
    })),
  };
}

export function transformSystemExpenseStatement(
  statement: StatementResult
): StatementResult {
  return {
    ...statement,
    opening: formatSystemLedgerBalanceMeta(statement.opening, "expense"),
    closing: formatSystemLedgerBalanceMeta(statement.closing, "expense"),
    lines: statement.lines.map((line) => ({
      ...line,
      remark: parseSystemLedgerParticular(line.remark, "expense"),
      balance_meta: formatSystemLedgerBalanceMeta(line.balance_meta, "expense"),
      invoice_number: null,
      vehicle_number: null,
    })),
  };
}

export function getSystemIncomeStatementLabels(): StatementTableLabels {
  return {
    layout: "system-income",
    invoiceColumn: "",
    debitColumn: "",
    creditColumn: "Received",
    showVehicleColumn: false,
    dueBadgePrefix: "",
  };
}

export function getSystemExpenseStatementLabels(): StatementTableLabels {
  return {
    layout: "system-expense",
    invoiceColumn: "",
    debitColumn: "Paid",
    creditColumn: "",
    showVehicleColumn: false,
    dueBadgePrefix: "",
  };
}