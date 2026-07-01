"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  FileText,
  LogOut,
  Menu,
  Search,
  X,
} from "lucide-react";
import type { SystemLedgerNavLink } from "@/lib/queries/system-party.queries";
import type { DashboardExperience } from "@punchless/types";

import { Button } from "@punchless/ui/components/button";
import { cn } from "@punchless/ui/lib/utils";

import { DataLockHeaderButton } from "@/components/data-lock-header-button";
import { logout } from "@/lib/actions/auth.actions";
import { translateNavLabel } from "@/lib/i18n/owner-labels";
import { useDashboardExperienceStore } from "@/lib/stores/dashboard-experience.store";
import { useUiLanguageStore } from "@/lib/stores/ui-language.store";
import {
  filterNavGroups,
  findActiveGroupLabel,
  getNavItemLabel,
  isNavItemActive,
  MORE_TOOLS_GROUP_LABEL,
  type NavGroup,
  type NavItem,
} from "./sidebar-config";

interface DashboardNavHeaderProps {
  role: string;
  userName: string;
  companyName: string;
  dashboardExperience: DashboardExperience;
  hasDataLockPin: boolean;
  onSearchClick?: () => void;
  systemLedgerLinks?: SystemLedgerNavLink[];
}

function useNavLabels(experience: DashboardExperience) {
  const language = useUiLanguageStore((s) => s.language);

  function navLabel(item: NavItem) {
    return translateNavLabel(language, getNavItemLabel(item, experience));
  }

  function groupLabel(label: string) {
    return label === MORE_TOOLS_GROUP_LABEL
      ? translateNavLabel(language, label)
      : label;
  }

  return { navLabel, groupLabel };
}

function NavMenuLink({
  item,
  label,
  isActive,
  onNavigate,
  compact = false,
}: {
  item: NavItem;
  label: string;
  isActive: boolean;
  onNavigate?: () => void;
  compact?: boolean;
}) {
  const Icon = item.icon;

  if (item.comingSoon || !item.href) {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-2 text-muted-foreground/70",
          compact ? "px-3 py-2 text-sm" : "px-3 py-2.5 text-sm"
        )}
        aria-disabled
      >
        <span className="flex items-center gap-2.5">
          <Icon className="size-4 shrink-0 opacity-50" />
          {label}
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
        "flex items-center gap-2.5 rounded-md text-sm transition",
        compact ? "px-3 py-2" : "px-3 py-2.5",
        isActive
          ? "bg-accent font-medium text-accent-foreground"
          : "text-foreground hover:bg-accent/60"
      )}
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      {label}
    </Link>
  );
}

function NavGroupMenu({
  group,
  groupTitle,
  pathname,
  navLabel,
  onNavigate,
  systemLedgerLinks = [],
}: {
  group: NavGroup;
  groupTitle: string;
  pathname: string;
  navLabel: (item: NavItem) => string;
  onNavigate?: () => void;
  systemLedgerLinks?: SystemLedgerNavLink[];
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const isMoreTools = group.label === MORE_TOOLS_GROUP_LABEL;

  const groupActive = group.items.some(
    (item) => item.href && isNavItemActive(pathname, item.href)
  );

  useEffect(() => {
    if (!open) return;
    function handlePointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  if (group.items.length === 1 && !isMoreTools) {
    const item = group.items[0];
    return (
      <NavMenuLink
        item={item}
        label={navLabel(item)}
        isActive={item.href ? isNavItemActive(pathname, item.href) : false}
        onNavigate={onNavigate}
        compact
      />
    );
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition",
          groupActive || open
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
        )}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {groupTitle}
        <ChevronDown
          className={cn("size-4 transition", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute left-0 top-[calc(100%+0.35rem)] z-50 min-w-[13rem] rounded-lg border border-border bg-popover p-1 shadow-lg"
        >
          {group.items.map((item) => (
            <NavMenuLink
              key={`${group.label}-${item.label}`}
              item={item}
              label={navLabel(item)}
              isActive={item.href ? isNavItemActive(pathname, item.href) : false}
              onNavigate={() => {
                setOpen(false);
                onNavigate?.();
              }}
            />
          ))}
          {group.label === "Commerce" && systemLedgerLinks.length > 0 ? (
            <>
              <div className="my-1 border-t border-border" role="separator" />
              {systemLedgerLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => {
                    setOpen(false);
                    onNavigate?.();
                  }}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition",
                    isNavItemActive(pathname, link.href)
                      ? "bg-accent font-medium text-accent-foreground"
                      : "text-foreground hover:bg-accent/60"
                  )}
                >
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                  {link.label}
                </Link>
              ))}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MobileNavDrawer({
  groups,
  pathname,
  navLabel,
  groupLabel,
  companyName,
  userName,
  onClose,
  systemLedgerLinks = [],
}: {
  groups: NavGroup[];
  pathname: string;
  navLabel: (item: NavItem) => string;
  groupLabel: (label: string) => string;
  companyName: string;
  userName: string;
  onClose: () => void;
  systemLedgerLinks?: SystemLedgerNavLink[];
}) {
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close navigation menu"
      />
      <aside className="relative flex h-full w-72 max-w-[85vw] flex-col overflow-hidden border-r border-border bg-background shadow-xl">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="truncate text-lg font-bold tracking-tight text-foreground"
          >
            {companyName}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="shrink-0 border-b border-border px-4 py-3">
          <p className="truncate text-xs text-muted-foreground">{userName}</p>
        </div>

        <nav
          className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-3 py-4"
          aria-label="Main navigation"
        >
          {groups.map((group) => (
            <div key={group.label} className="space-y-1">
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {groupLabel(group.label)}
              </p>
              {group.items.map((item) => (
                <NavMenuLink
                  key={`${group.label}-${item.label}-mobile`}
                  item={item}
                  label={navLabel(item)}
                  isActive={item.href ? isNavItemActive(pathname, item.href) : false}
                  onNavigate={onClose}
                />
              ))}
              {group.label === "Commerce" && systemLedgerLinks.length > 0 ? (
                <>
                  <div className="my-1 border-t border-border" role="separator" />
                  {systemLedgerLinks.map((link) => (
                    <Link
                      key={`${link.href}-mobile`}
                      href={link.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition",
                        isNavItemActive(pathname, link.href)
                          ? "bg-accent font-medium text-accent-foreground"
                          : "text-foreground hover:bg-accent/60"
                      )}
                    >
                      <FileText className="size-4 shrink-0 text-muted-foreground" />
                      {link.label}
                    </Link>
                  ))}
                </>
              ) : null}
            </div>
          ))}
        </nav>
      </aside>
    </div>
  );
}

export function DashboardNavHeader({
  role,
  userName,
  companyName,
  dashboardExperience,
  hasDataLockPin,
  onSearchClick,
  systemLedgerLinks = [],
}: DashboardNavHeaderProps) {
  const pathname = usePathname();
  const storeExperience = useDashboardExperienceStore((s) => s.experience);
  const setExperience = useDashboardExperienceStore((s) => s.setExperience);
  const experience = storeExperience || dashboardExperience;
  const { navLabel, groupLabel } = useNavLabels(experience);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setExperience(dashboardExperience);
  }, [dashboardExperience, setExperience]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileNavOpen]);

  const groups = useMemo(
    () => filterNavGroups(role, experience),
    [role, experience]
  );

  const activeGroup = findActiveGroupLabel(groups, pathname);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            type="button"
            className="shrink-0 lg:hidden"
            onClick={() => setMobileNavOpen((open) => !open)}
            aria-label={mobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileNavOpen}
          >
            {mobileNavOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>

          <Link
            href="/dashboard"
            className="max-w-[12rem] shrink-0 truncate text-lg font-bold tracking-tight text-foreground sm:max-w-none sm:text-xl"
          >
            {companyName}
          </Link>
        </div>

        <nav
          className="hidden min-w-0 flex-1 items-center gap-0.5 overflow-visible px-1 lg:flex"
          aria-label="Main navigation"
        >
          {groups.map((group) => (
            <NavGroupMenu
              key={group.label}
              group={group}
              groupTitle={groupLabel(group.label)}
              pathname={pathname}
              navLabel={navLabel}
              systemLedgerLinks={systemLedgerLinks}
            />
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <DataLockHeaderButton hasDataLockPin={hasDataLockPin} />
          {onSearchClick ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onSearchClick}
              className="hidden gap-2 md:inline-flex"
            >
              <Search className="size-4" />
              <span>Search</span>
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                Ctrl+K
              </kbd>
            </Button>
          ) : null}
          {onSearchClick ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onSearchClick}
              className="md:hidden"
              aria-label="Search"
            >
              <Search className="size-4" />
            </Button>
          ) : null}

          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-foreground">{userName}</p>
            <p className="text-xs capitalize text-muted-foreground">{role}</p>
          </div>

          <form action={logout}>
            <Button variant="ghost" size="icon" type="submit" title="Logout">
              <LogOut className="size-4" />
            </Button>
          </form>
        </div>
      </div>

      {activeGroup ? (
        <div className="hidden border-t border-border/60 px-4 py-1.5 text-xs text-muted-foreground lg:block xl:hidden">
          <span className="font-medium text-foreground">{groupLabel(activeGroup)}</span>
        </div>
      ) : null}
      </header>

      {mobileNavOpen ? (
        <MobileNavDrawer
          groups={groups}
          pathname={pathname}
          navLabel={navLabel}
          groupLabel={groupLabel}
        companyName={companyName}
        userName={userName}
        onClose={() => setMobileNavOpen(false)}
        systemLedgerLinks={systemLedgerLinks}
        />
      ) : null}
    </>
  );
}