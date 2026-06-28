"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, Receipt } from "lucide-react";

import { cn } from "@punchless/ui/lib/utils";
import { CommerceFlowPanel } from "@/components/commerce-flow-panel";
import { QuickBillModal } from "@/components/quick-bill-modal";
import type { ClientWithDue } from "@/lib/queries/client.queries";
import { PageFirstVisitTip } from "@/components/page-first-visit-tip";
import { CustomerManager } from "./customer-manager";

export type CustomerCommerceTab = "customers" | "new-bill";

type ClientSummary = { totalClients: number; totalDue: number };

type Props = {
  customers: ClientWithDue[];
  summary: ClientSummary;
  billClients: ClientWithDue[];
  initialCustomerId?: string;
  initialOpen?: "pay" | "invoice";
  initialTab?: CustomerCommerceTab;
};

const TABS: { id: CustomerCommerceTab; label: string; icon: typeof Building2 }[] = [
  { id: "customers", label: "Customers", icon: Building2 },
  { id: "new-bill", label: "New bill", icon: Receipt },
];

export function CustomerCommerceHub({
  customers,
  summary,
  billClients,
  initialCustomerId,
  initialOpen,
  initialTab = "customers",
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<CustomerCommerceTab>(initialTab);
  const [quickBillOpen, setQuickBillOpen] = useState(initialTab === "new-bill");

  useEffect(() => {
    const param = searchParams.get("tab") as CustomerCommerceTab | null;
    if (param && TABS.some((t) => t.id === param)) {
      setTab(param);
      if (param === "new-bill") setQuickBillOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (initialTab === "new-bill") setQuickBillOpen(true);
  }, [initialTab]);

  function selectTab(next: CustomerCommerceTab) {
    setTab(next);
    if (next === "new-bill") setQuickBillOpen(true);

    const params = new URLSearchParams(searchParams.toString());
    if (next === "customers") {
      params.delete("tab");
    } else {
      params.set("tab", next);
    }
    const qs = params.toString();
    router.replace(qs ? `/dashboard/customers?${qs}` : "/dashboard/customers", {
      scroll: false,
    });
  }

  return (
    <div className="space-y-6">
      <PageFirstVisitTip pageId="customers" />
      <nav
        aria-label="Customer commerce"
        className="flex flex-wrap gap-2 border-b border-border pb-3"
      >
        {TABS.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => selectTab(item.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-primary/10 text-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="size-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {tab === "customers" ? (
        <>
          <CommerceFlowPanel />
          <CustomerManager
            customers={customers}
            summary={summary}
            initialCustomerId={initialCustomerId}
            initialOpen={initialOpen}
          />
        </>
      ) : null}

      {tab === "new-bill" ? (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Bill a customer</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Record a sales bill — it posts to the customer ledger automatically.
          </p>
          <button
            type="button"
            className="mt-4 text-sm font-medium text-primary hover:underline"
            onClick={() => setQuickBillOpen(true)}
          >
            Open bill form
          </button>
        </div>
      ) : null}

      <QuickBillModal
        open={quickBillOpen}
        onOpenChange={(open) => {
          setQuickBillOpen(open);
          if (!open && tab === "new-bill") selectTab("customers");
        }}
        clients={billClients}
        initialClientId={initialCustomerId ?? ""}
      />
    </div>
  );
}