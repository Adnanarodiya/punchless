"use client";

import {
  PageHeader as UiPageHeader,
  type PageHeaderProps,
} from "@punchless/ui/components/page-header";

export type { PageHeaderProps };

export function PageHeader(props: PageHeaderProps) {
  return <UiPageHeader {...props} />;
}