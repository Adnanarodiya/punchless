"use client";

import type { KeyboardEvent } from "react";

import { cn } from "@punchless/ui/lib/utils";
import { handleEnterToNextField } from "@/lib/utils/form-keyboard";
import type { SettlementType } from "@/lib/validations/settlement.schema";

type Props = {
  value: SettlementType;
  onChange: (value: SettlementType) => void;
  name?: string;
  idPrefix?: string;
  onEnterAdvance?: () => void;
};

export function SettlementTypeField({
  value,
  onChange,
  name = "settlementType",
  idPrefix = "settlement",
  onEnterAdvance,
}: Props) {
  const directId = `${idPrefix}SettlementDirect`;
  const againstId = `${idPrefix}SettlementAgainst`;

  function handleOptionEnter(event: KeyboardEvent<HTMLLabelElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (onEnterAdvance) {
      onEnterAdvance();
      return;
    }
    handleEnterToNextField(event);
  }

  return (
    <div>
      <span className="mb-2 block text-sm font-medium">Settlement</span>
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            { value: "direct" as const, label: "Direct", domId: directId },
            { value: "against_bill" as const, label: "Against bill", domId: againstId },
          ] as const
        ).map((option) => (
          <label
            key={option.value}
            id={option.domId}
            tabIndex={0}
            onKeyDown={handleOptionEnter}
            className={cn(
              "flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2.5 text-sm font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              value === option.value
                ? "border-primary bg-primary/10 text-foreground"
                : "border-input text-muted-foreground hover:bg-accent/50"
            )}
          >
            <input
              type="radio"
              name={`${name}Ui`}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
      <input type="hidden" name={name} value={value} />
    </div>
  );
}