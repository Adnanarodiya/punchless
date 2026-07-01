"use client";

import { useRouter } from "next/navigation";

import { SupplierStatementRowActions } from "@/components/supplier-statement-row-actions";
import { StatementScreen } from "@/components/statement-screen";
import { isSystemExpenseSupplier } from "@/lib/constants/system-parties";
import type { BankWithBalance } from "@/lib/queries/bank.queries";
import type { CompanyProfile } from "@/lib/queries/settings.queries";
import type { SupplierWithPayable } from "@/lib/queries/supplier.queries";
import type { StatementResult } from "@/lib/utils/statement";
import {
  getSystemExpenseStatementLabels,
  transformSystemExpenseStatement,
} from "@/lib/utils/system-statement-display";

interface Props {
  supplier: SupplierWithPayable;
  company: CompanyProfile;
  startDate: string;
  endDate: string;
  statement: StatementResult;
  banks: BankWithBalance[];
}

export function SupplierStatementManager({
  supplier,
  company,
  startDate,
  endDate,
  statement,
  banks,
}: Props) {
  const router = useRouter();
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
      renderRowActions={(line) => (
        <SupplierStatementRowActions
          supplierId={supplier.id}
          line={line}
          banks={banks}
          onSuccess={() => router.refresh()}
        />
      )}
    />
  );
}