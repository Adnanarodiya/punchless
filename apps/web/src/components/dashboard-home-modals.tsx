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

import { AddExpenseModal } from "@/components/add-expense-modal";
import { CollectPaymentModal } from "@/components/collect-payment-modal";
import { QuickBillModal } from "@/components/quick-bill-modal";
import { PaySupplierModal } from "@/components/pay-supplier-modal";
import type { BankWithBalance } from "@/lib/queries/bank.queries";
import type { ClientWithDue } from "@/lib/queries/client.queries";
import type { SupplierWithPayable } from "@/lib/queries/supplier.queries";

type DashboardHomeModalsContextValue = {
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
  children: ReactNode;
};

export function DashboardHomeModals({ clients, suppliers, banks, children }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [quickBillOpen, setQuickBillOpen] = useState(false);
  const [collectPaymentOpen, setCollectPaymentOpen] = useState(false);
  const [paySupplierOpen, setPaySupplierOpen] = useState(false);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [initialClientId, setInitialClientId] = useState("");
  const [initialCollectClientId, setInitialCollectClientId] = useState("");
  const [initialSupplierId, setInitialSupplierId] = useState("");

  const clearHomeModalParams = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("quickBill");
    params.delete("collectPayment");
    params.delete("paySupplier");
    params.delete("addExpense");
    params.delete("customer");
    params.delete("supplier");
    params.delete("open");
    const qs = params.toString();
    router.replace(qs ? `/dashboard?${qs}` : "/dashboard", { scroll: false });
  }, [router, searchParams]);

  const openQuickBill = useCallback((clientId?: string) => {
    setInitialClientId(clientId ?? "");
    setQuickBillOpen(true);
  }, []);

  const openCollectPayment = useCallback((clientId?: string) => {
    setInitialCollectClientId(clientId ?? "");
    setCollectPaymentOpen(true);
  }, []);

  const openPaySupplier = useCallback((supplierId?: string) => {
    setInitialSupplierId(supplierId ?? "");
    setPaySupplierOpen(true);
  }, []);

  const openAddExpense = useCallback(() => {
    setAddExpenseOpen(true);
  }, []);

  useEffect(() => {
    const quickBill = searchParams.get("quickBill");
    const collectPayment = searchParams.get("collectPayment");
    const paySupplier = searchParams.get("paySupplier");
    const addExpense = searchParams.get("addExpense");
    const customerId = searchParams.get("customer");
    const supplierId = searchParams.get("supplier");
    const open = searchParams.get("open");

    if (quickBill === "1") {
      openQuickBill(customerId ?? undefined);
      clearHomeModalParams();
    } else if (collectPayment === "1" || (customerId && open === "pay")) {
      openCollectPayment(customerId ?? undefined);
      clearHomeModalParams();
    } else if (paySupplier === "1" || (supplierId && open === "pay")) {
      openPaySupplier(supplierId ?? undefined);
      clearHomeModalParams();
    } else if (addExpense === "1") {
      openAddExpense();
      clearHomeModalParams();
    }
  }, [
    searchParams,
    openQuickBill,
    openCollectPayment,
    openPaySupplier,
    openAddExpense,
    clearHomeModalParams,
  ]);

  return (
    <DashboardHomeModalsContext.Provider
      value={{ openQuickBill, openCollectPayment, openPaySupplier, openAddExpense }}
    >
      {children}

      <QuickBillModal
        open={quickBillOpen}
        onOpenChange={setQuickBillOpen}
        clients={clients}
        initialClientId={initialClientId}
      />

      <CollectPaymentModal
        open={collectPaymentOpen}
        onOpenChange={setCollectPaymentOpen}
        clients={clients}
        initialClientId={initialCollectClientId}
      />

      <PaySupplierModal
        open={paySupplierOpen}
        onOpenChange={setPaySupplierOpen}
        suppliers={suppliers}
        initialSupplierId={initialSupplierId}
      />

      <AddExpenseModal
        open={addExpenseOpen}
        onOpenChange={setAddExpenseOpen}
        banks={banks}
      />
    </DashboardHomeModalsContext.Provider>
  );
}