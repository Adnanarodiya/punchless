"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

import { cn } from "@punchless/ui/lib/utils";
import { useNavigationStore } from "@/lib/stores/navigation.store";

export function PageNavigationLoader() {
  const pathname = usePathname();
  const isNavigating = useNavigationStore((s) => s.isNavigating);
  const startNavigation = useNavigationStore((s) => s.startNavigation);
  const stopNavigation = useNavigationStore((s) => s.stopNavigation);
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || anchor.target === "_blank") return;

      try {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === pathname) return;
        startNavigation();
      } catch {
        // ignore invalid href
      }
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname, startNavigation]);

  useEffect(() => {
    if (prevPathRef.current === pathname) return;
    prevPathRef.current = pathname;

    if (!isNavigating) return;

    const timer = window.setTimeout(() => {
      stopNavigation();
    }, 350);

    return () => window.clearTimeout(timer);
  }, [pathname, isNavigating, stopNavigation]);

  if (!isNavigating) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[90] flex flex-col items-center justify-center gap-3",
        "bg-background/75 backdrop-blur-[2px]"
      )}
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="size-10 animate-spin text-primary" aria-hidden />
      <p className="text-sm font-medium text-muted-foreground">Loading page…</p>
    </div>
  );
}