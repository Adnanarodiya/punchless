"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { CollectPaymentModal } from "@/components/collect-payment-modal";
import { GeneralEntryModal } from "@/components/general-entry-modal";
import { PaySupplierModal } from "@/components/pay-supplier-modal";
import { PurchaseBillModal } from "@/components/purchase-bill-modal";
import { QuickBillModal } from "@/components/quick-bill-modal";
import type { BankWithBalance } from "@/lib/queries/bank.queries";
import type { ClientWithDue } from "@/lib/queries/client.queries";
import type { SupplierWithPayable } from "@/lib/queries/supplier.queries";

type DashboardHomeModalsContextValue = {
  openSalesBill: (clientId?: string) => void;
  openPurchaseBill: (supplierId?: string) => void;
  openGeneralEntry: () => void;
  /** @deprecated Use openSalesBill */
  openQuickBill: (clientId?: string) => void;
  openCollectPayment: (clientId?: string) => void;
  openPaySupplier: (supplierId?: string) => void;
  openAddExpense: () => void;
};

const DashboardHomeModalsContext =
  createContext<DashboardHomeModalsContextValue | null>(null);

export function useDashboardHomeModals() {
  const ctx = useContext(DashboardHomeModalsContext);
  if (!ctx) {
    throw new Error("useDashboardHomeModals must be used within DashboardHomeModals");
  }
  return ctx;
}

export function useDashboardHomeModalsOptional() {
  return useContext(DashboardHomeModalsContext);
}

type Props = {
  clients: ClientWithDue[];
  suppliers: SupplierWithPayable[];
  banks: BankWithBalance[];
  invoicePrefix?: string;
  children: ReactNode;
};

export function DashboardHomeModals({
  clients,
  suppliers,
  banks,
  invoicePrefix = "ISHABA",
  children,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [salesBillOpen, setSalesBillOpen] = useState(false);
  const [purchaseBillOpen, setPurchaseBillOpen] = useState(false);
  const [collectPaymentOpen, setCollectPaymentOpen] = useState(false);
  const [paySupplierOpen, setPaySupplierOpen] = useState(false);
  const [generalOpen, setGeneralOpen] = useState(false);
  const [initialClientId, setInitialClientId] = useState("");
  const [initialSupplierId, setInitialSupplierId] = useState("");
  const [initialCollectClientId, setInitialCollectClientId] = useState("");
  const [initialPaySupplierId, setInitialPaySupplierId] = useState("");

  const clearHomeModalParams = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("quickBill");
    params.delete("salesBill");
    params.delete("purchaseBill");
    params.delete("general");
    params.delete("collectPayment");
    params.delete("paySupplier");
    params.delete("addExpense");
    params.delete("customer");
    params.delete("supplier");
    params.delete("open");
    const qs = params.toString();
    router.replace(qs ? `/dashboard?${qs}` : "/dashboard", { scroll: false });
  }, [router, searchParams]);

  const openSalesBill = useCallback((clientId?: string) => {
    setInitialClientId(clientId ?? "");
    setSalesBillOpen(true);
  }, []);

  const openPurchaseBill = useCallback((supplierId?: string) => {
    setInitialSupplierId(supplierId ?? "");
    setPurchaseBillOpen(true);
  }, []);

  const openCollectPayment = useCallback((clientId?: string) => {
    setInitialCollectClientId(clientId ?? "");
    setCollectPaymentOpen(true);
  }, []);

  const openPaySupplier = useCallback((supplierId?: string) => {
    setInitialPaySupplierId(supplierId ?? "");
    setPaySupplierOpen(true);
  }, []);

  const openGeneralEntry = useCallback(() => {
    setGeneralOpen(true);
  }, []);

  useEffect(() => {
    const salesBill = searchParams.get("salesBill") ?? searchParams.get("quickBill");
    const purchaseBill = searchParams.get("purchaseBill");
    const collectPayment = searchParams.get("collectPayment");
    const paySupplier = searchParams.get("paySupplier");
    const general = searchParams.get("general") ?? searchParams.get("addExpense");
    const customerId = searchParams.get("customer");
    const supplierId = searchParams.get("supplier");

    if (salesBill === "1") {
      openSalesBill(customerId ?? undefined);
      clearHomeModalParams();
    } else if (purchaseBill === "1") {
      openPurchaseBill(supplierId ?? undefined);
      clearHomeModalParams();
    } else if (collectPayment === "1") {
      openCollectPayment(customerId ?? undefined);
      clearHomeModalParams();
    } else if (paySupplier === "1") {
      openPaySupplier(supplierId ?? undefined);
      clearHomeModalParams();
    } else if (general === "1") {
      openGeneralEntry();
      clearHomeModalParams();
    }
  }, [searchParams, openSalesBill, openPurchaseBill, openCollectPayment, openPaySupplier, openGeneralEntry, clearHomeModalParams]);

  const refresh = () => router.refresh();

  return (
    <DashboardHomeModalsContext.Provider
      value={{
        openSalesBill,
        openPurchaseBill,
        openGeneralEntry,
        openQuickBill: openSalesBill,
        openCollectPayment,
        openPaySupplier,
        openAddExpense: openGeneralEntry,
      }}
    >
      {children}

      <QuickBillModal
        open={salesBillOpen}
        onOpenChange={setSalesBillOpen}
        clients={clients}
        invoicePrefix={invoicePrefix}
        initialClientId={initialClientId}
        onSuccess={refresh}
      />

      <PurchaseBillModal
        open={purchaseBillOpen}
        onOpenChange={setPurchaseBillOpen}
        suppliers={suppliers}
        initialSupplierId={initialSupplierId}
        onSuccess={refresh}
      />

      <CollectPaymentModal
        open={collectPaymentOpen}
        onOpenChange={setCollectPaymentOpen}
        clients={clients}
        banks={banks}
        initialClientId={initialCollectClientId}
        onSuccess={refresh}
      />

      <PaySupplierModal
        open={paySupplierOpen}
        onOpenChange={setPaySupplierOpen}
        suppliers={suppliers}
        banks={banks}
        initialSupplierId={initialPaySupplierId}
        onSuccess={refresh}
      />

      <GeneralEntryModal
        open={generalOpen}
        onOpenChange={setGeneralOpen}
        clients={clients}
        suppliers={suppliers}
        banks={banks}
        onSuccess={refresh}
      />
    </DashboardHomeModalsContext.Provider>
  );
}