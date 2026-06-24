"use client";

import Link from "next/link";
import { Button } from "@punchless/ui/components/button";

export function PrintActions() {
  return (
    <div className="flex items-center justify-between print:hidden">
      <Link href="/dashboard/invoices">
        <Button variant="outline">← Back to Invoices</Button>
      </Link>
      <Button type="button" onClick={() => window.print()}>
        Print
      </Button>
    </div>
  );
}