"use client";

import Link from "next/link";
import { Button } from "@punchless/ui/components/button";

interface PrintActionsProps {
  backHref: string;
}

export function PrintActions({ backHref }: PrintActionsProps) {
  return (
    <div className="mx-auto flex max-w-5xl items-center justify-between px-6 pt-6 print:hidden">
      <Link href={backHref}>
        <Button variant="outline">← Back to Statement</Button>
      </Link>
      <Button type="button" onClick={() => window.print()}>
        Print
      </Button>
    </div>
  );
}