"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus,
  X,
  Pencil,
  RotateCcw,
  FileText,
  ArrowLeftRight,
} from "lucide-react";

import { Button } from "@punchless/ui/components/button";
import { PageHeader } from "@punchless/ui/components/page-header";
import { DataTable } from "@punchless/ui/components/data-table";
import { cn } from "@punchless/ui/lib/utils";

import {
  createBank,
  updateBank,
  softDeleteBank,
  recoverBank,
} from "@/lib/actions/bank.actions";
import type { BankSummary, BankWithBalance } from "@/lib/queries/bank.queries";
import { formatCurrency } from "@/lib/utils/formatting";
import { useAction, toastAction } from "@/hooks/use-action";
import { DeleteConfirmButton } from "@/components/delete-confirm-button";

interface Props {
  banks: BankWithBalance[];
  summary: BankSummary;
}

type ViewFilter = "active" | "deleted";

export function BankManager({ banks, summary }: Props) {
  const [mode, setMode] = useState<"list" | "add" | "edit">("list");
  const [editingBank, setEditingBank] = useState<BankWithBalance | null>(null);
  const [viewFilter, setViewFilter] = useState<ViewFilter>("active");

  const filteredBanks = useMemo(
    () =>
      banks.filter((bank) =>
        viewFilter === "active" ? !bank.is_deleted : bank.is_deleted
      ),
    [banks, viewFilter]
  );

  const { execute: execCreate, loading: creating } = useAction(createBank, {
    successMessage: "Bank account created!",
    onSuccess: () => setMode("list"),
  });

  const { execute: execUpdate, loading: updating } = useAction(updateBank, {
    successMessage: "Bank account updated!",
    onSuccess: () => {
      setMode("list");
      setEditingBank(null);
    },
  });

  const { execute: execDelete, loading: deleting } = useAction(softDeleteBank, {
    successMessage: "Bank deleted",
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Banks"
        description="Manage bank accounts, deposits, withdrawals, and transfers."
      >
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/banks/transactions">
              <ArrowLeftRight className="size-4" /> Transactions
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/banks/transfer">Transfer</Link>
          </Button>
          <Button onClick={() => { setMode("add"); setEditingBank(null); }}>
            <Plus className="size-4" /> New Bank
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Active Banks</p>
          <p className="mt-1 text-3xl font-bold">{summary.totalBanks}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">Total Bank Balance</p>
          <p className="mt-1 text-3xl font-bold">
            {formatCurrency(summary.totalBalance)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {(mode === "add" || mode === "edit") && (
          <div className="rounded-xl border border-border bg-card p-5 lg:col-span-1">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {mode === "add" ? "New Bank" : "Edit Bank"}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { setMode("list"); setEditingBank(null); }}
              >
                <X className="size-4" />
              </Button>
            </div>
            <form
              action={
                mode === "edit" && editingBank
                  ? async (fd) => {
                      fd.set("bankId", editingBank.id);
                      await execUpdate(fd);
                    }
                  : execCreate
              }
              className="space-y-3"
            >
              <Field label="Bank Name" name="bankName" required defaultValue={editingBank?.bank_name} />
              <Field label="A/C Name" name="accountName" required defaultValue={editingBank?.account_name} />
              <Field label="A/C Number" name="accountNumber" defaultValue={editingBank?.account_number ?? ""} />
              <Field label="IFSC" name="ifscCode" defaultValue={editingBank?.ifsc_code ?? ""} />
              {mode === "add" ? (
                <Field label="Opening Balance (₹)" name="openingBalance" type="number" min="0" step="0.01" defaultValue="0" />
              ) : (
                <input type="hidden" name="openingBalance" value={editingBank?.opening_balance ?? 0} />
              )}
              <Button type="submit" className="w-full" loading={mode === "add" ? creating : updating} disabled={mode === "add" ? creating : updating}>
                {mode === "add" ? "Create Bank" : "Save Changes"}
              </Button>
            </form>
          </div>
        )}

        <div className={cn("rounded-xl border border-border bg-card p-5", mode === "list" ? "lg:col-span-3" : "lg:col-span-2")}>
          <div className="mb-4 flex gap-2">
            <FilterButton active={viewFilter === "active"} onClick={() => setViewFilter("active")}>
              Active
            </FilterButton>
            <FilterButton active={viewFilter === "deleted"} onClick={() => setViewFilter("deleted")}>
              Deleted
            </FilterButton>
          </div>

          <DataTable
            data={filteredBanks}
            getRowKey={(row) => row.id}
            enableSearch
            searchPlaceholder="Search banks…"
            searchFilter={(row, query) =>
              [row.bank_name, row.account_name, row.account_number, row.ifsc_code]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
                .includes(query)
            }
            emptyMessage="No bank accounts yet."
            columns={[
              {
                key: "bank",
                header: "Bank",
                cell: (row) => (
                  <div>
                    <p className="font-medium">{row.bank_name}</p>
                    <p className="text-xs text-muted-foreground">{row.account_name}</p>
                  </div>
                ),
              },
              { key: "ac", header: "A/C Number", cell: (row) => row.account_number || "—" },
              { key: "ifsc", header: "IFSC", cell: (row) => row.ifsc_code || "—" },
              {
                key: "opening",
                header: "Opening",
                cell: (row) => formatCurrency(row.opening_balance),
              },
              {
                key: "balance",
                header: "Current Balance",
                cell: (row) => (
                  <span className="font-medium">{formatCurrency(row.current_balance)}</span>
                ),
              },
              {
                key: "actions",
                header: "Actions",
                cell: (row) => (
                  <div className="flex gap-1">
                    {!row.is_deleted ? (
                      <>
                        <Button variant="ghost" size="sm" asChild title="Statement">
                          <Link href={`/dashboard/banks/${row.id}/statement`}>
                            <FileText className="size-3.5" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setEditingBank(row); setMode("edit"); }} title="Edit">
                          <Pencil className="size-3.5" />
                        </Button>
                        <DeleteConfirmButton
                          entityName={row.bank_name}
                          entityType="bank"
                          size="sm"
                          loading={deleting}
                          onConfirm={async () => {
                            const fd = new FormData();
                            fd.set("bankId", row.id);
                            await execDelete(fd);
                          }}
                        />
                      </>
                    ) : (
                      <form action={toastAction(recoverBank, "Bank recovered")}>
                        <input type="hidden" name="bankId" value={row.id} />
                        <Button variant="ghost" size="sm" type="submit" title="Recover">
                          <RotateCcw className="size-3.5" />
                        </Button>
                      </form>
                    )}
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
  min,
  step,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  required?: boolean;
  min?: string;
  step?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium">{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        required={required}
        min={min}
        step={step}
        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
      />
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg px-3 py-1.5 text-sm font-medium transition",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-muted/80"
      )}
    >
      {children}
    </button>
  );
}