"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Breadcrumbs } from "@punchless/ui/components/breadcrumbs";
import { StatementEntityBox } from "@punchless/ui/components/statement-entity-box";
import { StatementLetterhead } from "@punchless/ui/components/statement-letterhead";
import { StatementTable } from "@punchless/ui/components/statement-table";
import type { StatementTableLabels } from "@punchless/ui/components/statement-table";
import { StatementToolbar } from "@punchless/ui/components/statement-toolbar";
import { Button } from "@punchless/ui/components/button";



import type { CompanyProfile } from "@/lib/queries/settings.queries";
import type { StatementResult } from "@/lib/utils/statement";
import { defaultStatementDateRange } from "@/lib/utils/statement-date-range";

type BreadcrumbItem = { label: string; href?: string };

interface StatementScreenProps {
  breadcrumbs: BreadcrumbItem[];
  entityTitle?: string;
  entityLines: { label: string; value: string }[];
  company: CompanyProfile;
  startDate: string;
  endDate: string;
  statementPath: string;
  printPath: string;
  statement: StatementResult;
  tableLabels: StatementTableLabels;
  renderRowActions?: (line: StatementResult["lines"][number]) => ReactNode;
}

function filterStatementLines(
  lines: StatementResult["lines"],
  search: string
) {
  const query = search.trim().toLowerCase();
  if (!query) return lines;

  return lines.filter((line) =>
    [
      line.invoice_number,
      line.vehicle_number,
      line.remark,
      line.user_name,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query))
  );
}

export function StatementScreen({
  breadcrumbs,
  entityTitle,
  entityLines,
  company,
  startDate,
  endDate,
  statementPath,
  printPath,
  statement,
  tableLabels,
  renderRowActions,
}: StatementScreenProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filteredLines = useMemo(
    () => filterStatementLines(statement.lines, search),
    [statement.lines, search]
  );
  const isSystemLedger =
    tableLabels.layout === "system-income" ||
    tableLabels.layout === "system-expense";

  function handleFilter(formData: FormData) {
    const start = String(formData.get("startDate") || "");
    const end = String(formData.get("endDate") || "");
    router.push(`${statementPath}?start=${start}&end=${end}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 print:hidden">
        <Breadcrumbs
          linkComponent={({ href, children, className }) => (
            <Link href={href} className={className}>
              {children}
            </Link>
          )}
          items={breadcrumbs}
        />
      </div>

      <form
        action={handleFilter}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4 print:hidden"
      >
        <div>
          <label htmlFor="startDate" className="mb-1 block text-sm font-medium">
            Start Date
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={startDate}
            required
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
          />
        </div>
        <div>
          <label htmlFor="endDate" className="mb-1 block text-sm font-medium">
            End Date
          </label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            defaultValue={endDate}
            required
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
          />
        </div>
        <Button type="submit">Apply</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const { start, end } = defaultStatementDateRange();
            router.push(`${statementPath}?start=${start}&end=${end}`);
          }}
        >
          Last 12 months
        </Button>
      </form>

      <StatementToolbar
        search={search}
        onSearchChange={setSearch}
        onPrint={() => window.print()}
        printHref={`${printPath}?start=${startDate}&end=${endDate}`}
      />

      <div
        id="printMe"
        className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-6 print:border-0 print:p-0 print:shadow-none"
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
          lines={filteredLines}
          labels={tableLabels}
          renderActions={
            renderRowActions
              ? (row) => renderRowActions(row as StatementResult["lines"][number])
              : undefined
          }
        />
      </div>
    </div>
  );
}