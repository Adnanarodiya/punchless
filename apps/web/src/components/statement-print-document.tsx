import { StatementEntityBox } from "@punchless/ui/components/statement-entity-box";
import { StatementLetterhead } from "@punchless/ui/components/statement-letterhead";
import { StatementTable } from "@punchless/ui/components/statement-table";
import type { StatementTableLabels } from "@punchless/ui/components/statement-table";

import type { CompanyProfile } from "@/lib/queries/settings.queries";
import type { StatementResult } from "@/lib/utils/statement";

interface StatementPrintDocumentProps {
  company: CompanyProfile;
  entityTitle?: string;
  entityLines: { label: string; value: string }[];
  startDate: string;
  endDate: string;
  statement: StatementResult;
  tableLabels: StatementTableLabels;
}

export function StatementPrintDocument({
  company,
  entityTitle,
  entityLines,
  startDate,
  endDate,
  statement,
  tableLabels,
}: StatementPrintDocumentProps) {
  const isSystemLedger =
    tableLabels.layout === "system-income" ||
    tableLabels.layout === "system-expense";

  return (
    <div
      id="printMe"
      className="mx-auto max-w-5xl space-y-4 p-6 print:p-0"
    >
      <StatementLetterhead
        companyName={company.name}
        tagline={company.tagline}
        address={company.address}
        phone={company.phone}
        email={company.email}
        logoUrl={company.logo_url}
      />

      <StatementEntityBox
        title={entityTitle}
        lines={entityLines}
        startDate={startDate}
        endDate={endDate}
        variant={isSystemLedger ? "system" : "party"}
      />

      <StatementTable
        totals={statement.totals}
        lines={statement.lines}
        labels={tableLabels}
        enablePagination={false}
      />
    </div>
  );
}