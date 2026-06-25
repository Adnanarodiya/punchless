import { getBanks, getBanksSummary } from "@/lib/queries/bank.queries";
import { BankManager } from "./bank-manager";

export default async function BanksPage() {
  const [banks, summary] = await Promise.all([
    getBanks({ includeDeleted: true }),
    getBanksSummary(),
  ]);

  return <BankManager banks={banks} summary={summary} />;
}