import { getBankTransactions, getBanks } from "@/lib/queries/bank.queries";
import { BankTransactionsManager } from "./bank-transactions-manager";

export default async function BankTransactionsPage() {
  const [banks, transactions] = await Promise.all([
    getBanks(),
    getBankTransactions(),
  ]);

  return (
    <BankTransactionsManager banks={banks} transactions={transactions} />
  );
}