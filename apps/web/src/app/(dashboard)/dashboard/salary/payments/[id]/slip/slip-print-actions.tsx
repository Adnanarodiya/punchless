"use client";

import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";

import { Button } from "@punchless/ui/components/button";

type Props = {
  backHref?: string;
};

export function SlipPrintActions({ backHref = "/dashboard/salary?tab=history" }: Props) {
  return (
    <div className="mx-auto flex max-w-3xl items-center justify-between px-6 pt-6 print:hidden">
      <Button variant="outline" size="sm" asChild>
        <Link href={backHref}>
          <ArrowLeft className="size-4" />
          Back
        </Link>
      </Button>
      <Button size="sm" onClick={() => window.print()}>
        <Printer className="size-4" />
        Print / Save PDF
      </Button>
    </div>
  );
}