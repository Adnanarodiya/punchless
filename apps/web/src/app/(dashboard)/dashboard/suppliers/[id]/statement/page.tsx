import { notFound } from "next/navigation";

import {
  getSupplierById,
  getSupplierStatement,
} from "@/lib/queries/supplier.queries";

import { SupplierStatementManager } from "./statement-manager";

function defaultDateRange() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  return {
    start: start.toISOString().slice(0, 10),
    end: today.toISOString().slice(0, 10),
  };
}

export default async function SupplierStatementPage({
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

  const supplier = await getSupplierById(id);
  if (!supplier) notFound();

  const statement = await getSupplierStatement(id, startDate, endDate);

  return (
    <SupplierStatementManager
      supplier={supplier}
      startDate={startDate}
      endDate={endDate}
      openingBalance={statement.openingBalance}
      closingBalance={statement.closingBalance}
      lines={statement.lines}
    />
  );
}