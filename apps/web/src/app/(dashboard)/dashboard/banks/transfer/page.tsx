import { getBankTransfers, getBanks } from "@/lib/queries/bank.queries";
import { BankTransferManager } from "./bank-transfer-manager";

export default async function BankTransferPage() {
  const [banks, transfers] = await Promise.all([
    getBanks(),
    getBankTransfers(),
  ]);

  return <BankTransferManager banks={banks} transfers={transfers} />;
}