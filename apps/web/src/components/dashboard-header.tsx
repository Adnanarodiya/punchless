"use client";

import Link from "next/link";
import { GraduationCap, LogOut, Menu, Search } from "lucide-react";
import { Button } from "@punchless/ui/components/button";
import { logout } from "@/lib/actions/auth.actions";
import { DataLockHeaderButton } from "@/components/data-lock-header-button";

interface DashboardHeaderProps {
  userName: string;
  role: string;
  onMenuClick?: () => void;
  onSearchClick?: () => void;
}

export function DashboardHeader({
  userName,
  role,
  onMenuClick,
  onSearchClick,
}: DashboardHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4 sm:px-6">
      <div className="flex items-center gap-2">
        {onMenuClick ? (
          <Button
            variant="ghost"
            size="icon"
            type="button"
            className="lg:hidden"
            onClick={onMenuClick}
            aria-label="Open navigation menu"
          >
            <Menu className="size-5" />
          </Button>
        ) : null}
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <DataLockHeaderButton />
        <Button variant="outline" size="sm" asChild className="gap-2">
          <Link href="/dashboard/learn">
            <GraduationCap className="size-4" />
            <span className="hidden sm:inline">Learn</span>
          </Link>
        </Button>
        {onSearchClick ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSearchClick}
            className="hidden gap-2 sm:inline-flex"
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
            className="sm:hidden"
            aria-label="Search"
          >
            <Search className="size-4" />
          </Button>
        ) : null}
        <div className="text-right">
          <p className="text-sm font-medium text-foreground">{userName}</p>
          <p className="text-xs text-muted-foreground capitalize">{role}</p>
        </div>

        <form action={logout}>
          <Button variant="ghost" size="icon" type="submit" title="Logout">
            <LogOut className="size-4" />
          </Button>
        </form>
      </div>
    </header>
  );
}
