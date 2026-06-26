import { getSuppliers, getSuppliersSummary } from "@/lib/queries/supplier.queries";
import { SupplierManager } from "./supplier-manager";

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ supplier?: string; open?: string }>;
}) {
  const params = await searchParams;
  const [suppliers, summary] = await Promise.all([
    getSuppliers({ includeDeleted: true }),
    getSuppliersSummary(),
  ]);

  return (
    <SupplierManager
      suppliers={suppliers}
      summary={summary}
      initialSupplierId={params.supplier}
      initialOpen={params.open === "pay" ? "pay" : undefined}
    />
  );
}