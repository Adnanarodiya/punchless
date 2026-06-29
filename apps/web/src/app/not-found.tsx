import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4 rounded-xl border border-border bg-card p-8 text-center">
        <h1 className="text-2xl font-bold text-foreground">Page not found</h1>
        <p className="text-sm text-muted-foreground">
          The page you are looking for does not exist or may have been moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}