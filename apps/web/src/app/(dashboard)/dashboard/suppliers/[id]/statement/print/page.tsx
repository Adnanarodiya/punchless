import { notFound } from "next/navigation";

import { StatementPrintDocument } from "@/components/statement-print-document";
import { isSystemExpenseSupplier } from "@/lib/constants/system-parties";
import {
  getSupplierById,
  getSupplierStatement,
} from "@/lib/queries/supplier.queries";
import { getCompanyProfile } from "@/lib/queries/settings.queries";
import { defaultStatementDateRange } from "@/lib/utils/statement-date-range";
import {
  getSystemExpenseStatementLabels,
  transformSystemExpenseStatement,
} from "@/lib/utils/system-statement-display";

import { PrintActions } from "./print-actions";

export default async function SupplierStatementPrintPage({
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

  const [supplier, company, statement] = await Promise.all([
    getSupplierById(id),
    getCompanyProfile(),
    getSupplierStatement(id, startDate, endDate),
  ]);

  if (!supplier || !company) notFound();

  const isSystemExpense = isSystemExpenseSupplier(supplier);
  const displayStatement = isSystemExpense
    ? transformSystemExpenseStatement(statement)
    : statement;

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
        statement={displayStatement}
        tableLabels={
          isSystemExpense
            ? getSystemExpenseStatementLabels()
            : {
                invoiceColumn: "Bill No.",
                debitColumn: "Dr (Supplier bills)",
                creditColumn: "Cr (Paid)",
                showVehicleColumn: false,
                dueBadgePrefix: "Payable",
              }
        }
      />
    </div>
  );
}