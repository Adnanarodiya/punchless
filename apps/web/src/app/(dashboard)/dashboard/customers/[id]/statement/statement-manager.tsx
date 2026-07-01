"use client";

import { useRouter } from "next/navigation";

import { ClientStatementRowActions } from "@/components/client-statement-row-actions";
import { StatementScreen } from "@/components/statement-screen";
import { isSystemIncomeClient } from "@/lib/constants/system-parties";
import type { BankWithBalance } from "@/lib/queries/bank.queries";
import type { ClientWithDue } from "@/lib/queries/client.queries";
import type { CompanyProfile } from "@/lib/queries/settings.queries";
import type { StatementResult } from "@/lib/utils/statement";
import {
  getSystemIncomeStatementLabels,
  transformSystemIncomeStatement,
} from "@/lib/utils/system-statement-display";

interface Props {
  client: ClientWithDue;
  company: CompanyProfile;
  startDate: string;
  endDate: string;
  statement: StatementResult;
  banks: BankWithBalance[];
}

export function StatementManager({
  client,
  company,
  startDate,
  endDate,
  statement,
  banks,
}: Props) {
  const router = useRouter();
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
    <StatementScreen
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Customers", href: "/dashboard/customers" },
        { label: client.name },
      ]}
      entityLines={entityLines}
      company={company}
      startDate={startDate}
      endDate={endDate}
      statementPath={`/dashboard/customers/${client.id}/statement`}
      printPath={`/dashboard/customers/${client.id}/statement/print`}
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
      renderRowActions={(line) => (
        <ClientStatementRowActions
          clientId={client.id}
          line={line}
          banks={banks}
          onSuccess={() => router.refresh()}
        />
      )}
    />
  );
}