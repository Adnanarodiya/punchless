"use client";

import type { ReactElement } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@punchless/ui/components/tooltip";

interface Props {
  label: string;
  children: ReactElement;
  side?: "top" | "right" | "bottom" | "left";
}

/** Wraps icon-only controls with an accessible hover/focus label. */
export function IconTooltip({ label, children, side = "top" }: Props) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  );
}