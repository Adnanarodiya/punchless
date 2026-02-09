"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl p-8 max-w-lg w-full text-center space-y-4">
        <div className="bg-red-500/10 text-red-500 p-3 rounded-full w-fit mx-auto">
          <AlertCircle className="size-8" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">
          {error.message || "An unexpected error occurred."}
        </p>

        {/* Dev error details */}
        {process.env.NODE_ENV === "development" && error.stack && (
          <details className="text-left p-4 bg-gray-900 rounded-lg border border-gray-800">
            <summary className="cursor-pointer font-medium text-sm text-gray-400">
              Error Details
            </summary>
            <pre className="mt-2 text-xs text-red-400 whitespace-pre-wrap break-words font-mono">
              {error.message}
              {"\n"}
              {error.stack}
            </pre>
          </details>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition"
          >
            <RotateCcw className="size-4" />
            Try Again
          </button>
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition"
          >
            <Home className="size-4" />
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
