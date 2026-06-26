"use client";

import { StatementScreen } from "@/components/statement-screen";
import type { ClientWithDue } from "@/lib/queries/client.queries";
import type { CompanyProfile } from "@/lib/queries/settings.queries";
import type { StatementResult } from "@/lib/utils/statement";

interface Props {
  client: ClientWithDue;
  company: CompanyProfile;
  startDate: string;
  endDate: string;
  statement: StatementResult;
}

export function StatementManager({
  client,
  company,
  startDate,
  endDate,
  statement,
}: Props) {
  const entityLines = [
    { label: "Name", value: client.name },
    ...(client.contact ? [{ label: "Contact", value: client.contact }] : []),
    ...(client.gst_number
      ? [{ label: "GSTIN", value: client.gst_number }]
      : []),
    ...(client.address ? [{ label: "Address", value: client.address }] : []),
  ];

  return (
    <StatementScreen
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Clients", href: "/dashboard/clients" },
        { label: client.name },
      ]}
      entityLines={entityLines}
      company={company}
      startDate={startDate}
      endDate={endDate}
      statementPath={`/dashboard/clients/${client.id}/statement`}
      printPath={`/dashboard/clients/${client.id}/statement/print`}
      statement={statement}
      tableLabels={{
        invoiceColumn: "Invoice No.",
        debitColumn: "Dr (Billed)",
        creditColumn: "Cr (Received)",
        showVehicleColumn: true,
        dueBadgePrefix: "Due",
      }}
    />
  );
}