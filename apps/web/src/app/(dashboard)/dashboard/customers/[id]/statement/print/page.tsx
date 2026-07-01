import { notFound } from "next/navigation";

import { StatementPrintDocument } from "@/components/statement-print-document";
import { isSystemIncomeClient } from "@/lib/constants/system-parties";
import {
  getClientById,
  getClientStatement,
} from "@/lib/queries/client.queries";
import { getCompanyProfile } from "@/lib/queries/settings.queries";
import { defaultStatementDateRange } from "@/lib/utils/statement-date-range";
import {
  getSystemIncomeStatementLabels,
  transformSystemIncomeStatement,
} from "@/lib/utils/system-statement-display";

import { PrintActions } from "./print-actions";

export default async function ClientStatementPrintPage({
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

  const [client, company, statement] = await Promise.all([
    getClientById(id),
    getCompanyProfile(),
    getClientStatement(id, startDate, endDate),
  ]);

  if (!client || !company) notFound();

  const isSystemIncome = isSystemIncomeClient(client);
  const displayStatement = isSystemIncome
    ? transformSystemIncomeStatement(statement)
    : statement;

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
        statement={displayStatement}
        tableLabels={
          isSystemIncome
            ? getSystemIncomeStatementLabels()
            : {
                invoiceColumn: "Invoice No.",
                debitColumn: "Dr (Billed)",
                creditColumn: "Cr (Received)",
                showVehicleColumn: true,
                dueBadgePrefix: "Due",
              }
        }
      />
    </div>
  );
}