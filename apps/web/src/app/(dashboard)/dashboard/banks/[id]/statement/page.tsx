import { notFound } from "next/navigation";

import { getBankById, getBankStatement } from "@/lib/queries/bank.queries";
import { defaultStatementDateRange } from "@/lib/utils/statement-date-range";
import { BankStatementManager } from "./statement-manager";

export default async function BankStatementPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const defaults = defaultStatementDateRange();
  const startDate = query.start || defaults.start;
  const endDate = query.end || defaults.end;

  const bank = await getBankById(id);
  if (!bank) notFound();

  const statement = await getBankStatement(id, startDate, endDate);

  return (
    <BankStatementManager
      bank={bank}
      startDate={startDate}
      endDate={endDate}
      openingBalance={statement.openingBalance}
      closingBalance={statement.closingBalance}
      lines={statement.lines}
    />
  );
}