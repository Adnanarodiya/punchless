"use client";

import { StatementScreen } from "@/components/statement-screen";
import type { CompanyProfile } from "@/lib/queries/settings.queries";
import type { SupplierWithPayable } from "@/lib/queries/supplier.queries";
import type { StatementResult } from "@/lib/utils/statement";

interface Props {
  supplier: SupplierWithPayable;
  company: CompanyProfile;
  startDate: string;
  endDate: string;
  statement: StatementResult;
}

export function SupplierStatementManager({
  supplier,
  company,
  startDate,
  endDate,
  statement,
}: Props) {
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
    <StatementScreen
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Suppliers", href: "/dashboard/suppliers" },
        { label: supplier.name },
      ]}
      entityLines={entityLines}
      company={company}
      startDate={startDate}
      endDate={endDate}
      statementPath={`/dashboard/suppliers/${supplier.id}/statement`}
      printPath={`/dashboard/suppliers/${supplier.id}/statement/print`}
      statement={statement}
      tableLabels={{
        invoiceColumn: "Bill No.",
        debitColumn: "Dr (Supplier bills)",
        creditColumn: "Cr (Paid)",
        showVehicleColumn: false,
        dueBadgePrefix: "Payable",
      }}
    />
  );
}