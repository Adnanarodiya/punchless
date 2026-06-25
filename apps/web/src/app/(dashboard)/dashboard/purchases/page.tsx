import { Suspense } from "react";

import { getPurchaseInvoices } from "@/lib/queries/purchase.queries";
import { getActiveSuppliers } from "@/lib/queries/supplier.queries";
import { PurchaseManager } from "./purchase-manager";

export default async function PurchasesPage() {
  const [purchases, suppliers] = await Promise.all([
    getPurchaseInvoices(),
    getActiveSuppliers(),
  ]);

  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading purchases…</div>}>
      <PurchaseManager purchases={purchases} suppliers={suppliers} />
    </Suspense>
  );
}