"use client";

import * as React from "react";

import { Sidebar } from "@/components/sidebar";
import { DashboardHeader } from "@/components/dashboard-header";

interface DashboardShellProps {
  role: string;
  userName: string;
  companyName: string;
  children: React.ReactNode;
}

export function DashboardShell({
  role,
  userName,
  companyName,
  children,
}: DashboardShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen bg-background">
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

      <div className="flex min-h-screen flex-1 flex-col">
        <DashboardHeader
          userName={userName}
          role={role}
          onMenuClick={() => setMobileNavOpen(true)}
        />
        <main id="main-content" className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}