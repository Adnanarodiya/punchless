import { notFound } from "next/navigation";

import { StatementPrintDocument } from "@/components/statement-print-document";
import {
  getSupplierById,
  getSupplierStatement,
} from "@/lib/queries/supplier.queries";
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

export default async function SupplierStatementPrintPage({
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

  const [supplier, company, statement] = await Promise.all([
    getSupplierById(id),
    getCompanyProfile(),
    getSupplierStatement(id, startDate, endDate),
  ]);

  if (!supplier || !company) notFound();

  const entityLines = [
    { label: "Name", value: supplier.name },
    ...(supplier.contact
      ? [{ label: "Contact", value: supplier.contact }]
      : []),
    ...(supplier.gst_number
      ? [{ label: "GSTIN", value: supplier.gst_number }]
      : []),
    ...(supplier.address
      ? [{ label: "Address", value: supplier.address }]
      : []),
  ];

  return (
    <div className="pb-8">
      <PrintActions
        backHref={`/dashboard/suppliers/${supplier.id}/statement?start=${startDate}&end=${endDate}`}
      />
      <StatementPrintDocument
        company={company}
        entityLines={entityLines}
        startDate={startDate}
        endDate={endDate}
        statement={statement}
        tableLabels={{
          invoiceColumn: "Purchase No.",
          debitColumn: "Dr (Purchases)",
          creditColumn: "Cr (Paid)",
          showVehicleColumn: false,
          dueBadgePrefix: "Payable",
        }}
      />
    </div>
  );
}