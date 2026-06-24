import { getSuppliers, getSuppliersSummary } from "@/lib/queries/supplier.queries";
import { SupplierManager } from "./supplier-manager";

export default async function SuppliersPage() {
  const [suppliers, summary] = await Promise.all([
    getSuppliers({ includeDeleted: true }),
    getSuppliersSummary(),
  ]);

  return <SupplierManager suppliers={suppliers} summary={summary} />;
}