import { notFound } from "next/navigation";

import { getBanks } from "@/lib/queries/bank.queries";
import {
  getSupplierById,
  getSupplierStatement,
} from "@/lib/queries/supplier.queries";
import { getCompanyProfile } from "@/lib/queries/settings.queries";
import { defaultStatementDateRange } from "@/lib/utils/statement-date-range";

import { SupplierStatementManager } from "./statement-manager";

export default async function SupplierStatementPage({
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

  const [supplier, company, statement, banks] = await Promise.all([
    getSupplierById(id),
    getCompanyProfile(),
    getSupplierStatement(id, startDate, endDate),
    getBanks(),
  ]);

  if (!supplier || !company) notFound();

  return (
    <SupplierStatementManager
      supplier={supplier}
      company={company}
      startDate={startDate}
      endDate={endDate}
      statement={statement}
      banks={banks}
    />
  );
}