import * as React from "react";
import { ChevronRight } from "lucide-react";

import { cn } from "../lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  linkComponent?: React.ElementType<{
    href: string;
    className?: string;
    children: React.ReactNode;
  }>;
}

export function Breadcrumbs({
  items,
  className,
  linkComponent: LinkComponent = "a",
}: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav
      data-slot="breadcrumbs"
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-1 text-sm", className)}
    >
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {index > 0 ? (
                <ChevronRight
                  className="size-3.5 text-muted-foreground"
                  aria-hidden
                />
              ) : null}
              {item.href && !isLast ? (
                <LinkComponent
                  href={item.href}
                  className="text-muted-foreground transition hover:text-foreground"
                >
                  {item.label}
                </LinkComponent>
              ) : (
                <span
                  className={cn(
                    isLast
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}