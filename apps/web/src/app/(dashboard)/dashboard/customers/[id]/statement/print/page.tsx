import { notFound } from "next/navigation";

import { StatementPrintDocument } from "@/components/statement-print-document";
import {
  getClientById,
  getClientStatement,
} from "@/lib/queries/client.queries";
import { getCompanyProfile } from "@/lib/queries/settings.queries";
import {
  getCurrentFinancialYearStartYear,
  getFinancialYearRangeToDate,
} from "@/lib/utils/financial-year";

import { PrintActions } from "./print-actions";

function defaultDateRange() {
  const range = getFinancialYearRangeToDate(getCurrentFinancialYearStartYear());
  return { start: range.start, end: range.end };
}

export default async function ClientStatementPrintPage({
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

  const entityLines = [
    { label: "Name", value: client.name },
    ...(client.contact ? [{ label: "Contact", value: client.contact }] : []),
    ...(client.gst_number
      ? [{ label: "GSTIN", value: client.gst_number }]
      : []),
    ...(client.address ? [{ label: "Address", value: client.address }] : []),
  ];

  return (
    <div className="pb-8">
      <PrintActions
        backHref={`/dashboard/customers/${client.id}/statement?start=${startDate}&end=${endDate}`}
      />
      <StatementPrintDocument
        company={company}
        entityLines={entityLines}
        startDate={startDate}
        endDate={endDate}
        statement={statement}
        tableLabels={{
          invoiceColumn: "Invoice No.",
          debitColumn: "Dr (Billed)",
          creditColumn: "Cr (Received)",
          showVehicleColumn: true,
          dueBadgePrefix: "Due",
        }}
      />
    </div>
  );
}