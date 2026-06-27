"use client";

import { useRef, useState } from "react";
import { Languages } from "lucide-react";
import type { UiLanguage } from "@punchless/types";

import { Button } from "@punchless/ui/components/button";
import { cn } from "@punchless/ui/lib/utils";
import { updateUiLanguage } from "@/lib/actions/settings.actions";
import { ownerLabel } from "@/lib/i18n/owner-labels";
import { useUiLanguageStore } from "@/lib/stores/ui-language.store";
import { useAction } from "@/hooks/use-action";

const OPTIONS: { value: UiLanguage; label: string }[] = [
  { value: "en", label: "English" },
  { value: "gu", label: "ગુજરાતી" },
  { value: "hi", label: "हिन्दी" },
];

interface Props {
  initialLanguage: UiLanguage;
}

export function UiLanguageToggle({ initialLanguage }: Props) {
  const storeLang = useUiLanguageStore((s) => s.language);
  const setLanguage = useUiLanguageStore((s) => s.setLanguage);
  const [selected, setSelected] = useState<UiLanguage>(storeLang || initialLanguage);
  const revertRef = useRef<UiLanguage>(initialLanguage);

  const { execute, loading } = useAction(updateUiLanguage, {
    successMessage: "Language updated",
    onError: () => {
      setSelected(revertRef.current);
      setLanguage(revertRef.current);
    },
  });

  async function saveLanguage(language: UiLanguage) {
    revertRef.current = storeLang || selected;
    setSelected(language);
    setLanguage(language);
    const formData = new FormData();
    formData.set("language", language);
    await execute(formData);
  }

  const hintLang = selected;

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Languages className="size-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">
            {ownerLabel(hintLang, "settings.uiLanguage")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {ownerLabel(hintLang, "settings.uiLanguageHint")}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            type="button"
            variant="ghost"
            disabled={loading}
            onClick={() => void saveLanguage(opt.value)}
            className={cn(
              "h-9 rounded-md border px-4 text-sm font-medium",
              selected === opt.value
                ? "border-primary bg-primary/10 text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {opt.label}
          </Button>
        ))}
      </div>
    </div>
  );
}