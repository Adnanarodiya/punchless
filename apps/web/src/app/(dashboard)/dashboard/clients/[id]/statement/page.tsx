import { notFound } from "next/navigation";

import {
  getClientById,
  getClientStatement,
} from "@/lib/queries/client.queries";

import { StatementManager } from "./statement-manager";

function defaultDateRange() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  return {
    start: start.toISOString().slice(0, 10),
    end: today.toISOString().slice(0, 10),
  };
}

export default async function ClientStatementPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const defaults = defaultDateRange();
  const startDate = query.start || defaults.start;
  const endDate = query.end || defaults.end;

  const client = await getClientById(id);
  if (!client) notFound();

  const statement = await getClientStatement(id, startDate, endDate);

  return (
    <StatementManager
      client={client}
      startDate={startDate}
      endDate={endDate}
      openingBalance={statement.openingBalance}
      closingBalance={statement.closingBalance}
      lines={statement.lines}
    />
  );
}