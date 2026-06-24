import { getPurchaseInvoices } from "@/lib/queries/purchase.queries";
import { getActiveSuppliers } from "@/lib/queries/supplier.queries";
import { PurchaseManager } from "./purchase-manager";

export default async function PurchasesPage() {
  const [purchases, suppliers] = await Promise.all([
    getPurchaseInvoices(),
    getActiveSuppliers(),
  ]);

  return <PurchaseManager purchases={purchases} suppliers={suppliers} />;
}