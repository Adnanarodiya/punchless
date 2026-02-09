"use client";

import { LogOut } from "lucide-react";
import { Button } from "@punchless/ui/components/button";
import { logout } from "@/lib/actions/auth.actions";

interface DashboardHeaderProps {
  userName: string;
  role: string;
}

export function DashboardHeader({ userName, role }: DashboardHeaderProps) {
  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-6 shrink-0">
      <div />

      <div className="flex items-center gap-4">
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
