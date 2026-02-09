"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@punchless/ui/components/button";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-card border border-border rounded-xl p-8 max-w-lg w-full text-center space-y-4">
        <div className="bg-destructive/10 text-destructive p-3 rounded-full w-fit mx-auto">
          <AlertCircle className="size-8" />
        </div>
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">
          {error.message || "An unexpected error occurred."}
        </p>

        {/* Dev error details */}
        {process.env.NODE_ENV === "development" && error.stack && (
          <details className="text-left p-4 bg-muted rounded-lg">
            <summary className="cursor-pointer font-medium text-sm text-muted-foreground">
              Error Details
            </summary>
            <pre className="mt-2 text-xs text-destructive whitespace-pre-wrap break-words font-mono">
              {error.message}
              {"\n"}
              {error.stack}
            </pre>
          </details>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => reset()}>
            <RotateCcw className="size-4" />
            Try Again
          </Button>
          <Button onClick={() => router.push("/dashboard")}>
            <Home className="size-4" />
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
