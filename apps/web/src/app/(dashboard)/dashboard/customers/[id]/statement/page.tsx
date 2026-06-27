import { notFound } from "next/navigation";

import {
  getClientById,
  getClientStatement,
} from "@/lib/queries/client.queries";
import { getCompanyProfile } from "@/lib/queries/settings.queries";
import {
  getCurrentFinancialYearStartYear,
  getFinancialYearRangeToDate,
} from "@/lib/utils/financial-year";

import { StatementManager } from "./statement-manager";

function defaultDateRange() {
  const range = getFinancialYearRangeToDate(getCurrentFinancialYearStartYear());
  return { start: range.start, end: range.end };
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

  const [client, company, statement] = await Promise.all([
    getClientById(id),
    getCompanyProfile(),
    getClientStatement(id, startDate, endDate),
  ]);

  if (!client || !company) notFound();

  return (
    <StatementManager
      client={client}
      company={company}
      startDate={startDate}
      endDate={endDate}
      statement={statement}
    />
  );
}