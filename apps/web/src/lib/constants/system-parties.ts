export const SYSTEM_INCOME_CLIENT_NAME = "INCOME" as const;
export const SYSTEM_EXPENSE_SUPPLIER_NAME = "EXPENSE" as const;

export const RESERVED_PARTY_NAMES = [
  SYSTEM_INCOME_CLIENT_NAME,
  SYSTEM_EXPENSE_SUPPLIER_NAME,
] as const;

export function isReservedPartyName(name: string): boolean {
  const upper = name.trim().toUpperCase();
  return RESERVED_PARTY_NAMES.includes(upper as (typeof RESERVED_PARTY_NAMES)[number]);
}

export function formatSystemIncomeRemark(remark: string): string {
  const detail = remark.trim();
  return detail ? `${SYSTEM_INCOME_CLIENT_NAME} - ${detail}` : SYSTEM_INCOME_CLIENT_NAME;
}

export function formatSystemExpenseRemark(remark: string): string {
  const detail = remark.trim();
  return detail ? `${SYSTEM_EXPENSE_SUPPLIER_NAME} - ${detail}` : SYSTEM_EXPENSE_SUPPLIER_NAME;
}

export function isSystemIncomeClient(party: {
  name: string;
  is_system?: boolean | null;
}): boolean {
  return Boolean(party.is_system) || party.name === SYSTEM_INCOME_CLIENT_NAME;
}

export function isSystemExpenseSupplier(party: {
  name: string;
  is_system?: boolean | null;
}): boolean {
  return Boolean(party.is_system) || party.name === SYSTEM_EXPENSE_SUPPLIER_NAME;
}