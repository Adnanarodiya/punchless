"use client";

import * as React from "react";

import { Sidebar } from "@/components/sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import {
  GlobalSearch,
  useGlobalSearchShortcut,
} from "@/components/global-search";
import { PageNavigationLoader } from "@/components/page-navigation-loader";
import { useDataLockIdle } from "@/hooks/use-data-lock-idle";
import { useDataLockStore } from "@/lib/stores/data-lock.store";
import { TooltipProvider } from "@punchless/ui/components/tooltip";

interface DashboardShellProps {
  role: string;
  userName: string;
  companyName: string;
  hasDataLockPin: boolean;
  children: React.ReactNode;
}

export function DashboardShell({
  role,
  userName,
  companyName,
  hasDataLockPin,
  children,
}: DashboardShellProps) {
  const setHasPin = React.useCallback(
    (pin: boolean) => useDataLockStore.getState().setHasPin(pin),
    []
  );

  React.useEffect(() => {
    setHasPin(hasDataLockPin);
  }, [hasDataLockPin, setHasPin]);

  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);

  const openSearch = React.useCallback(() => setSearchOpen(true), []);
  useGlobalSearchShortcut(openSearch);
  useDataLockIdle(hasDataLockPin);

  return (
    <TooltipProvider>
    <div className="flex h-screen overflow-hidden bg-background">
      <PageNavigationLoader />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <Sidebar
        role={role}
        userName={userName}
        companyName={companyName}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <DashboardHeader
          userName={userName}
          role={role}
          onMenuClick={() => setMobileNavOpen(true)}
          onSearchClick={openSearch}
        />
        <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
        <main id="main-content" className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
    </TooltipProvider>
  );
}