import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { cn } from "@punchless/ui/lib/utils";

export type FlowStep = {
  step: number;
  label: string;
  hint: string;
  icon: LucideIcon;
  href?: string;
  current?: boolean;
};

type Props = {
  headingId: string;
  title: string;
  description: string;
  steps: FlowStep[];
  className?: string;
};

function StepContent({ item }: { item: FlowStep }) {
  const Icon = item.icon;

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground">
          {item.step}
        </span>
        <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-sm font-medium leading-snug text-foreground">{item.label}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">{item.hint}</p>
      </div>
    </div>
  );
}

const stepCardClass =
  "flex h-full min-h-[5.5rem] flex-col rounded-lg border border-border bg-muted/20 p-3 transition";

export function FlowStepPanel({
  headingId,
  title,
  description,
  steps,
  className,
}: Props) {
  return (
    <section
      className={cn("rounded-xl border border-border bg-card p-4 sm:p-5", className)}
      aria-labelledby={headingId}
    >
      <h2 id={headingId} className="text-sm font-semibold text-foreground">
        {title}
      </h2>
      <p className="mb-3 text-xs text-muted-foreground">{description}</p>
      <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((item) => {
          const highlighted = item.current;
          const cardClass = cn(
            stepCardClass,
            highlighted &&
              "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
          );

          if (item.href) {
            return (
              <li key={item.step} className="min-w-0">
                <Link
                  href={item.href}
                  className={cn(
                    cardClass,
                    "hover:border-primary/30 hover:bg-accent/30"
                  )}
                >
                  <StepContent item={item} />
                </Link>
              </li>
            );
          }

          return (
            <li key={item.step} className="min-w-0">
              <div className={cardClass}>
                <StepContent item={item} />
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}