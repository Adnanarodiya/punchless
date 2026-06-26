import Link from "next/link";
import { Building2, FileText, IndianRupee } from "lucide-react";

import { cn } from "@punchless/ui/lib/utils";

/** Client receivables path — shown on the Clients page. */
export function CommerceFlowPanel({ className }: { className?: string }) {
  const steps = [
    {
      step: 1,
      label: "Add client",
      hint: "Opening balance if they already owe you",
      icon: Building2,
      current: true,
    },
    {
      step: 2,
      label: "Create invoice",
      hint: "GST bill — cash, bank, or credit",
      icon: FileText,
      href: "/dashboard/invoices",
    },
    {
      step: 3,
      label: "Receive payment",
      hint: "₹ button on each client row",
      icon: IndianRupee,
    },
    {
      step: 4,
      label: "Statement",
      hint: "Ledger with running balance",
      icon: FileText,
      href: "/dashboard/reports/rojmel",
    },
  ];

  return (
    <section
      className={cn("rounded-xl border border-border bg-card p-4 sm:p-5", className)}
      aria-labelledby="commerce-flow-heading"
    >
      <h2 id="commerce-flow-heading" className="text-sm font-semibold text-foreground">
        Client money flow
      </h2>
      <p className="mb-3 text-xs text-muted-foreground">
        Add client → invoice → collect payment → view statement on the client row.
      </p>
      <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((item) => {
          const Icon = item.icon;
          const inner = (
            <>
              <div className="mb-1 flex items-center gap-2">
                <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
                  {item.step}
                </span>
                <Icon className="size-3.5 text-muted-foreground" aria-hidden />
              </div>
              <span className="text-sm font-medium">{item.label}</span>
              <span className="text-xs text-muted-foreground">{item.hint}</span>
            </>
          );

          if (item.href) {
            return (
              <li key={item.step}>
                <Link
                  href={item.href}
                  className="block rounded-lg border border-border bg-muted/20 p-3 transition hover:border-primary/30 hover:bg-accent/30"
                >
                  {inner}
                </Link>
              </li>
            );
          }

          return (
            <li
              key={item.step}
              className={cn(
                "rounded-lg border p-3",
                item.current
                  ? "border-primary/40 bg-primary/5"
                  : "border-border bg-muted/20"
              )}
            >
              {inner}
            </li>
          );
        })}
      </ol>
    </section>
  );
}