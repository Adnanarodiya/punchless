"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

import { CollapsibleNavGroup } from "@punchless/ui/components/collapsible-nav-group";
import { cn } from "@punchless/ui/lib/utils";

import { filterNavGroups, type NavGroup, type NavItem } from "./sidebar-config";

interface SidebarProps {
  role: string;
  userName: string;
  companyName: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function NavLink({
  item,
  isActive,
  onNavigate,
}: {
  item: NavItem;
  isActive: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  if (item.comingSoon || !item.href) {
    return (
      <div
        className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground/70"
        aria-disabled
      >
        <span className="flex items-center gap-3">
          <Icon className="size-4 shrink-0 opacity-50" />
          {item.label}
        </span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Soon
        </span>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
        isActive
          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
      )}
    >
      <Icon className="size-4 shrink-0" />
      {item.label}
    </Link>
  );
}

function isNavItemActive(pathname: string, href: string) {
  return (
    pathname === href ||
    (href !== "/dashboard" && pathname.startsWith(href))
  );
}

function findActiveGroupLabel(groups: NavGroup[], pathname: string): string | null {
  for (const group of groups) {
    for (const item of group.items) {
      if (item.href && isNavItemActive(pathname, item.href)) {
        return group.label;
      }
    }
  }
  return groups[0]?.label ?? null;
}

export function Sidebar({
  role,
  userName,
  companyName,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const groups = useMemo(() => filterNavGroups(role), [role]);
  const [openGroup, setOpenGroup] = useState<string | null>(() =>
    findActiveGroupLabel(groups, pathname)
  );

  useEffect(() => {
    const active = findActiveGroupLabel(groups, pathname);
    if (active) setOpenGroup(active);
  }, [pathname, groups]);

  const content = (
    <>
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border px-6">
        <Link
          href="/dashboard"
          onClick={onMobileClose}
          className="text-xl font-bold text-sidebar-foreground"
        >
          ⚡ Punchless
        </Link>
        {onMobileClose ? (
          <button
            type="button"
            onClick={onMobileClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground lg:hidden"
            aria-label="Close navigation menu"
          >
            <X className="size-5" />
          </button>
        ) : null}
      </div>

      <div className="shrink-0 border-b border-sidebar-border px-4 py-3">
        <p className="truncate text-sm font-medium text-sidebar-foreground">
          {companyName}
        </p>
        <p className="truncate text-xs text-muted-foreground">{userName}</p>
      </div>

      <nav
        className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-3 py-4"
        aria-label="Main navigation"
      >
        {groups.map((group) => {
          if (group.items.length === 1) {
            const item = group.items[0];
            return (
              <div key={group.label} className="space-y-0.5">
                <NavLink
                  item={item}
                  isActive={item.href ? isNavItemActive(pathname, item.href) : false}
                  onNavigate={onMobileClose}
                />
              </div>
            );
          }

          return (
            <CollapsibleNavGroup
              key={group.label}
              label={group.label}
              open={openGroup === group.label}
              onOpenChange={(open) => setOpenGroup(open ? group.label : null)}
            >
              {group.items.map((item) => (
                <NavLink
                  key={item.label}
                  item={item}
                  isActive={item.href ? isNavItemActive(pathname, item.href) : false}
                  onNavigate={onMobileClose}
                />
              ))}
            </CollapsibleNavGroup>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      <aside className="hidden h-screen w-64 shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar lg:flex">
        {content}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={onMobileClose}
            aria-label="Close navigation menu"
          />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col overflow-hidden border-r border-sidebar-border bg-sidebar shadow-xl">
            {content}
          </aside>
        </div>
      ) : null}
    </>
  );
}