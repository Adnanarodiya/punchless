"use client";

import { useEffect } from "react";
import { Button } from "@punchless/ui/components/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an analytics service
    console.error("Dashboard error boundary caught error:", error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 shadow-sm space-y-6">
        {/* Warning Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive animate-pulse">
          <AlertTriangle className="size-8" />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Something went wrong</h2>
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred while loading this page. This could be due to a temporary database timeout or network disruption.
          </p>
        </div>

        {/* Error Details snippet */}
        {error.message && (
          <div className="p-3 bg-muted rounded-lg text-left text-xs font-mono text-muted-foreground overflow-auto max-h-24 select-all">
            {error.message}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button onClick={reset} className="flex-1 gap-2">
            <RefreshCw className="size-4" /> Try again
          </Button>
          <Link href="/dashboard" className="flex-1">
            <Button variant="outline" className="w-full gap-2">
              <Home className="size-4" /> Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
