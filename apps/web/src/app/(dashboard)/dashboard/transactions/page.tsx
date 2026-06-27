import { Suspense } from "react";

import { getBanks } from "@/lib/queries/bank.queries";
import { getTransactions } from "@/lib/queries/transaction.queries";
import { TransactionManager } from "./transaction-manager";

export default async function TransactionsPage() {
  const [transactions, banks] = await Promise.all([
    getTransactions(),
    getBanks(),
  ]);

  return (
    <Suspense fallback={null}>
      <TransactionManager transactions={transactions} banks={banks} />
    </Suspense>
  );
}