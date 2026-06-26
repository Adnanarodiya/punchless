"use client";

import { LearnPageHelp } from "@/components/learn-page-help";

interface DashboardPageTitleProps {
  title: string;
  className?: string;
}

/** Page `<h1>` with contextual ? help link to the learn guide. */
export function DashboardPageTitle({ title, className }: DashboardPageTitleProps) {
  return (
    <div className={className ?? "mb-6 flex items-center gap-2"}>
      <h1 className="text-2xl font-bold">{title}</h1>
      <LearnPageHelp />
    </div>
  );
}