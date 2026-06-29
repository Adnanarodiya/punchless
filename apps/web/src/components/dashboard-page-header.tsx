import type { ReactNode } from "react";

import { PageHeader } from "@/components/page-header";

interface DashboardPageHeaderProps {
  title: string;
  description: string;
  children?: ReactNode;
}

/** Standard dashboard page title + description. */
export function DashboardPageHeader({
  title,
  description,
  children,
}: DashboardPageHeaderProps) {
  return (
    <PageHeader title={title} description={description}>
      {children}
    </PageHeader>
  );
}