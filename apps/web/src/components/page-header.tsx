"use client";

import {
  PageHeader as UiPageHeader,
  type PageHeaderProps,
} from "@punchless/ui/components/page-header";

import { LearnPageHelp } from "@/components/learn-page-help";

export type { PageHeaderProps };

/** Dashboard PageHeader with contextual ? help link next to the title. */
export function PageHeader({ titleAddon, ...props }: PageHeaderProps) {
  return (
    <UiPageHeader
      {...props}
      titleAddon={titleAddon ?? <LearnPageHelp />}
    />
  );
}