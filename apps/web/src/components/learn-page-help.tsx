"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleHelp } from "lucide-react";

import { Button } from "@punchless/ui/components/button";

import { getLearnModuleById } from "@/lib/content/learn-modules";
import {
  learnGuideHref,
  resolveLearnModuleFromPath,
} from "@/lib/content/learn-route-map";

interface LearnPageHelpProps {
  /** Override auto-detected module (e.g. when used inside a shared layout). */
  moduleId?: string;
  className?: string;
}

export function LearnPageHelp({ moduleId, className }: LearnPageHelpProps) {
  const pathname = usePathname();
  const resolvedId = moduleId ?? resolveLearnModuleFromPath(pathname);

  if (!resolvedId) return null;

  const mod = getLearnModuleById(resolvedId);
  const label = mod ? `Learn how ${mod.title} works` : "Learn how this page works";

  return (
    <Button
      variant="ghost"
      size="icon"
      asChild
      className={className}
      title={label}
    >
      <Link href={learnGuideHref(resolvedId)} aria-label={label}>
        <CircleHelp className="size-5 text-muted-foreground" />
      </Link>
    </Button>
  );
}

