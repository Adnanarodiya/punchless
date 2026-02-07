"use client";

import { useTheme } from "next-themes";
import { LogOut, Moon, Sun } from "lucide-react";
import { Button } from "@punchless/ui/components/button";
import { logout } from "@/lib/actions/auth.actions";

interface DashboardHeaderProps {
  userName: string;
  role: string;
}

export function DashboardHeader({ userName, role }: DashboardHeaderProps) {
  const { setTheme, theme } = useTheme();

  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-6 shrink-0">
      <div />

      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title="Toggle Theme"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

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
