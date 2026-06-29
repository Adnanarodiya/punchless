"use client";

import { useRef, useState } from "react";
import { LayoutGrid, Sparkles } from "lucide-react";
import type { DashboardExperience } from "@punchless/types";
import { Button } from "@punchless/ui/components/button";
import { cn } from "@punchless/ui/lib/utils";
import { updateDashboardExperience } from "@/lib/actions/settings.actions";
import { useDashboardExperienceStore } from "@/lib/stores/dashboard-experience.store";
import { useAction } from "@/hooks/use-action";

interface Props {
  initialExperience: DashboardExperience;
}

export function DashboardExperienceToggle({ initialExperience }: Props) {
  const storeExperience = useDashboardExperienceStore((s) => s.experience);
  const setExperience = useDashboardExperienceStore((s) => s.setExperience);
  const [selected, setSelected] = useState<DashboardExperience>(
    storeExperience || initialExperience
  );
  const revertRef = useRef<DashboardExperience>(initialExperience);

  const { execute, loading } = useAction(updateDashboardExperience, {
    successMessage: "Dashboard experience updated",
    onError: () => {
      setSelected(revertRef.current);
      setExperience(revertRef.current);
    },
  });

  async function saveExperience(experience: DashboardExperience) {
    revertRef.current = storeExperience || selected;
    setSelected(experience);
    setExperience(experience);
    const formData = new FormData();
    formData.set("experience", experience);
    await execute(formData);
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <LayoutGrid className="size-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Dashboard experience</h2>
          <p className="text-sm text-muted-foreground">
            Simple mode shows only everyday tasks. Full mode shows every module.
          </p>
        </div>
      </div>

      <div className="inline-flex w-full max-w-md rounded-lg border border-input bg-muted/40 p-1 sm:w-auto">
        <Button
          type="button"
          variant="ghost"
          disabled={loading}
          onClick={() => void saveExperience("simple")}
          className={cn(
            "h-9 flex-1 gap-2 rounded-md px-4 text-sm font-medium sm:flex-none",
            selected === "simple"
              ? "bg-background text-foreground shadow-sm hover:bg-background"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Sparkles className="size-4" />
          Simple
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={loading}
          onClick={() => void saveExperience("full")}
          className={cn(
            "h-9 flex-1 gap-2 rounded-md px-4 text-sm font-medium sm:flex-none",
            selected === "full"
              ? "bg-background text-foreground shadow-sm hover:bg-background"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <LayoutGrid className="size-4" />
          Full
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        {selected === "simple"
          ? "Header shows Home, Customers, Suppliers, Staff, and Settings. Extra tools live under More tools."
          : "Header shows all modules — customers, suppliers, banks, reports, and more."}
      </p>
    </div>
  );
}