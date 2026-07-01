import { notFound } from "next/navigation";

import { getBanks } from "@/lib/queries/bank.queries";
import {
  getClientById,
  getClientStatement,
} from "@/lib/queries/client.queries";
import { getCompanyProfile } from "@/lib/queries/settings.queries";
import { defaultStatementDateRange } from "@/lib/utils/statement-date-range";

import { StatementManager } from "./statement-manager";

export default async function ClientStatementPage({
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

  const [client, company, statement, banks] = await Promise.all([
    getClientById(id),
    getCompanyProfile(),
    getClientStatement(id, startDate, endDate),
    getBanks(),
  ]);

  if (!client || !company) notFound();

  return (
    <StatementManager
      client={client}
      company={company}
      startDate={startDate}
      endDate={endDate}
      statement={statement}
      banks={banks}
    />
  );
}