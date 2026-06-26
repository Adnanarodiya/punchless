"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Circle, X, ListChecks } from "lucide-react";

import { Button } from "@punchless/ui/components/button";
import { cn } from "@punchless/ui/lib/utils";

import type { SetupChecklistStatus } from "@/lib/queries/setup-checklist.queries";

const DISMISS_KEY = "punchless-setup-checklist-dismissed";

interface Props {
  status: SetupChecklistStatus;
}

export function SetupChecklist({ status }: Props) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (status.allDone || dismissed) return null;

  const setupSteps = status.steps.filter((s) => s.id !== "learn");
  const setupDone = setupSteps.every((s) => s.done);

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  return (
    <section
      className="rounded-xl border border-primary/25 bg-primary/5 p-5"
      aria-labelledby="setup-checklist-heading"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/15 p-2 text-primary">
            <ListChecks className="size-5" aria-hidden />
          </div>
          <div>
            <h2 id="setup-checklist-heading" className="font-semibold text-foreground">
              Get started with Punchless
            </h2>
            <p className="text-sm text-muted-foreground">
              {status.completedCount} of {setupSteps.length} setup steps done
              {setupDone ? " — almost ready!" : ""}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={dismiss}
          aria-label="Dismiss setup checklist"
        >
          <X className="size-4" />
        </Button>
      </div>

      <ol className="space-y-2">
        {status.steps.map((step) => (
          <li key={step.id}>
            <Link
              href={step.href}
              className={cn(
                "flex items-start gap-3 rounded-lg border px-3 py-2.5 transition hover:border-primary/30 hover:bg-card",
                step.done ? "border-border/60 bg-card/50" : "border-border bg-card"
              )}
            >
              {step.done ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
              ) : (
                <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              )}
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block text-sm font-medium",
                    step.done && "text-muted-foreground line-through"
                  )}
                >
                  {step.label}
                </span>
                <span className="block text-xs text-muted-foreground">{step.description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}