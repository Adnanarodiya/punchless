"use client";

import Link from "next/link";
import { Printer } from "lucide-react";

import { Button } from "@punchless/ui/components/button";

interface PrintActionsProps {
  backHref: string;
}

export function PrintActions({ backHref }: PrintActionsProps) {
  return (
    <div className="mx-auto flex max-w-5xl items-center justify-between px-6 pt-6 print:hidden">
      <Button variant="outline" size="sm" asChild>
        <Link href={backHref}>← Back to statement</Link>
      </Button>
      <Button size="sm" onClick={() => window.print()}>
        <Printer className="size-4" />
        Print / Save PDF
      </Button>
    </div>
  );
}